from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.services import session_service, payment_service
from app.middleware.auth import require_operator, require_customer
from app.config.db import get_pool

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

class EntryModel(BaseModel):
    slotId: int
    userId: Optional[int] = None

class ExitModel(BaseModel):
    slotId: int
    userId: Optional[int] = None

@router.get("/active")
async def get_active_sessions(operator=Depends(require_operator)):
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT ps.*, s.label as slot_label 
            FROM parking_sessions ps
            JOIN parking_slots s ON ps.slot_id = s.id
            WHERE ps.status = 'active'
        """)
        return [dict(r) for r in records]

@router.get("/my")
async def get_my_sessions(page: int = 1, limit: int = 10, customer=Depends(require_customer)):
    offset = (page - 1) * limit
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT ps.*, s.label as slot_label, ps.status as session_status,
                   (SELECT id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_id,
                   (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as amount,
                   (SELECT method FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_method,
                   (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_status,
                   COALESCE((SELECT points FROM loyalty_points WHERE session_id = ps.id LIMIT 1), 0) as points_earned
            FROM parking_sessions ps
            JOIN parking_slots s ON ps.slot_id = s.id
            WHERE ps.user_id = $1
            ORDER BY ps.entry_time DESC
            LIMIT $2 OFFSET $3
        """, customer['id'], limit, offset)

        results = []
        for r in records:
            d = dict(r)
            # Auto-heal: Paid but still active
            if d['status'] == 'active' and d.get('payment_status') == 'paid':
                d['status'] = 'completed'
                d['session_status'] = 'completed'
                if not d.get('exit_time'):
                    d['exit_time'] = datetime.now(timezone.utc)
            if d.get('amount') is not None:
                d['amount'] = float(d['amount'])
            results.append(d)
        return results

@router.get("/slot/{slot_id}")
async def get_slot_session(slot_id: int, operator=Depends(require_operator)):
    try:
        session = await session_service.get_active_session(slot_id)
        pool = get_pool()
        
        if session:
            # Always look for a pending payment for this active session
            async with pool.acquire() as conn:
                payment = await conn.fetchrow("""
                    SELECT id, amount, status, method 
                    FROM payments 
                    WHERE session_id = $1 AND status = 'pending'
                    ORDER BY id DESC LIMIT 1
                """, session['id'])
                if payment:
                    session['pending_payment'] = dict(payment)
            return session
        else:
            # If no active session, check if there is a recently completed session that is awaiting payment
            async with pool.acquire() as conn:
                recent = await conn.fetchrow("""
                    SELECT ps.*, 
                           (SELECT id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as pending_payment_id,
                           (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as pending_amount,
                           (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as pending_status
                    FROM parking_sessions ps
                    WHERE ps.slot_id = $1 AND ps.status = 'completed'
                    ORDER BY ps.exit_time DESC LIMIT 1
                """, slot_id)
                
                if recent and recent['pending_status'] == 'pending':
                    s = dict(recent)
                    s['amountDue'] = float(recent['pending_amount'])
                    s['pending_payment'] = {
                        "id": recent['pending_payment_id'],
                        "amount": float(recent['pending_amount']),
                        "status": "pending",
                        "method": "cash"
                    }
                    return s
            
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview/{slot_id}")
async def preview_session(slot_id: int, operator=Depends(require_operator)):
    try:
        session = await session_service.get_active_session(slot_id)
        if not session:
            raise HTTPException(status_code=404, detail="No active session for this slot")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/entry")
async def entry_session(data: EntryModel, request: Request, operator=Depends(require_operator)):
    try:
        session = await session_service.start_session(data.slotId, data.userId)
        
        # Immediately mark the slot as visually occupied
        from app.services import slot_service
        slot = await slot_service.update_slot_status_by_id(data.slotId, 'occupied')
        
        # Broadcast the change to all dashboard clients
        sio = getattr(request.app.state, "sio", None)
        if sio and slot:
            await sio.emit("slotUpdated", {
                "id": slot["id"],
                "slotId": slot["id"],
                "label": slot["label"],
                "status": "occupied",
                "controllerId": slot["controller_id"]
            })
            await sio.emit("activityUpdate", {
                "type": "slot_sync",
                "slotLabel": slot["label"],
                "status": "occupied"
            })
            
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exit")
async def exit_session(data: ExitModel, operator=Depends(require_operator)):
    """
    End the active session for a slot and create a pending payment.
    SAFE: Checks for already-paid/completed sessions to prevent duplicate payments.
    """
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            # Step 1: Find ALL ACTIVE sessions for this slot
            active_sessions = await conn.fetch(
                "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active' ORDER BY id ASC",
                data.slotId
            )
            
            if not active_sessions:
                # Maybe the session was already ended (e.g. by MQTT physical departure).
                # Check if there's a recent completed session with a pending payment.
                recent = await conn.fetchrow("""
                    SELECT ps.*, 
                           (SELECT id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_id,
                           (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as pay_status,
                           (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as pay_amount
                    FROM parking_sessions ps
                    WHERE ps.slot_id = $1 AND ps.status = 'completed'
                    ORDER BY ps.exit_time DESC LIMIT 1
                """, data.slotId)
                
                if recent and recent['pay_status'] == 'pending':
                    # Session ended (by MQTT), payment still pending — return existing payment
                    return {
                        "message": "Session already ended, payment pending",
                        "session": dict(recent),
                        "payment": {"id": recent['payment_id'], "amount": float(recent['pay_amount']), "status": "pending"}
                    }
                elif recent and recent['pay_status'] == 'paid':
                    return {
                        "message": "Session already completed and paid",
                        "session": {**dict(recent), "status": "completed"},
                        "payment": {"id": recent['payment_id'], "status": "paid"}
                    }
                else:
                    raise HTTPException(status_code=404, detail="No active session for this slot")
            
            # Use the oldest active session as the main one, silently close the rest
            active = active_sessions[0]
            if len(active_sessions) > 1:
                for extra in active_sessions[1:]:
                    try:
                        await session_service.end_session_by_id(extra['id'])
                    except Exception as e:
                        print(f"Failed to auto-close extra active session {extra['id']}: {e}")
                        
            session = dict(active)
            
            # Step 2: Attach user if not already associated
            if data.userId and not session.get('user_id'):
                await conn.execute('UPDATE parking_sessions SET user_id = $1 WHERE id = $2', data.userId, session['id'])
                session['user_id'] = data.userId
            
            # Step 3: Check if a payment already exists for this session (idempotency guard)
            existing_payment = await conn.fetchrow(
                "SELECT * FROM payments WHERE session_id = $1 ORDER BY id DESC LIMIT 1",
                session['id']
            )
            
            if existing_payment and existing_payment['status'] == 'paid':
                # Already paid — just finalize the session and return
                await session_service.end_session_by_id(session['id'])
                return {
                    "message": "Session already paid, marked as completed",
                    "session": {**session, "status": "completed"},
                    "payment": dict(existing_payment)
                }
            
            # Step 4: Calculate the final amount (timer stops HERE)
            entry_time = active['entry_time']
            if entry_time.tzinfo is None:
                exit_time = datetime.now()
            else:
                exit_time = datetime.now(timezone.utc)
                
            duration_seconds = (exit_time - entry_time).total_seconds()
            duration_minutes = max(1, int(duration_seconds // 60))
            
            from app.utils.billing import calculate_amount
            amount_due = calculate_amount(entry_time, exit_time)
            
            # Step 5: Finalize the session immediately (atomic — timer is now stopped)
            await conn.execute(
                """
                UPDATE parking_sessions
                SET exit_time = $1, duration_minutes = $2, status = 'completed'
                WHERE id = $3
                """,
                exit_time, duration_minutes, session['id']
            )
            
            # Step 6: Release the slot
            from app.services.slot_service import update_slot_status_by_id
            try:
                await update_slot_status_by_id(session['slot_id'], 'available')
            except Exception as e:
                print(f"[exitSession] Slot release failed: {e}")
            
            # Step 7: Create payment record (or reuse pending)
            if existing_payment and existing_payment['status'] == 'pending':
                payment = dict(existing_payment)
            else:
                payment_record = await conn.fetchrow(
                    """
                    INSERT INTO payments (session_id, amount, method, status)
                    VALUES ($1, $2, 'cash', 'pending')
                    RETURNING *
                    """,
                    session['id'], amount_due
                )
                payment = dict(payment_record)
            
            session['status'] = 'completed'
            session['exit_time'] = exit_time
            session['duration_minutes'] = duration_minutes
            session['amountDue'] = amount_due
            
            return {
                "message": "Session ended, payment pending",
                "session": session,
                "payment": payment
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[exitSession] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_sessions(user_id: int, operator=Depends(require_operator)):
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT ps.*, s.label as slot_label,
                   (SELECT id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_id,
                   (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as amount,
                   (SELECT method FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_method,
                   (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_status
            FROM parking_sessions ps
            JOIN parking_slots s ON ps.slot_id = s.id
            WHERE ps.user_id = $1
            ORDER BY ps.entry_time DESC
        """, user_id)
        return [dict(r) for r in records]
