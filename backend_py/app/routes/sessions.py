from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
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
                   (SELECT method FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as method,
                   (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_status,
                   COALESCE((SELECT points FROM loyalty_points WHERE session_id = ps.id LIMIT 1), 0) as points_earned
            FROM parking_sessions ps
            JOIN parking_slots s ON ps.slot_id = s.id
            WHERE ps.user_id = $1
            ORDER BY ps.entry_time DESC
            LIMIT $2 OFFSET $3
        """, customer['id'], limit, offset)
        return [dict(r) for r in records]

@router.get("/slot/{slot_id}")
async def get_slot_session(slot_id: int, operator=Depends(require_operator)):
    try:
        session = await session_service.get_active_session(slot_id)
        return session
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
async def entry_session(data: EntryModel, operator=Depends(require_operator)):
    try:
        session = await session_service.start_session(data.slotId, data.userId)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exit")
async def exit_session(data: ExitModel, operator=Depends(require_operator)):
    try:
        session = await session_service.end_session(data.slotId)
        if not session:
            raise HTTPException(status_code=404, detail="No active session for this slot")
            
        if data.userId:
            pool = get_pool()
            async with pool.acquire() as conn:
                await conn.execute('UPDATE parking_sessions SET user_id = $1 WHERE id = $2', data.userId, session['id'])
                
        payment = await payment_service.create_payment(session['id'], session['amountDue'])
        
        return {
            "message": "Session ended",
            "session": session,
            "payment": payment
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_sessions(user_id: int, operator=Depends(require_operator)):
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT ps.*, s.label as slot_label,
                   (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as amount,
                   (SELECT method FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_method,
                   (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_status
            FROM parking_sessions ps
            JOIN parking_slots s ON ps.slot_id = s.id
            WHERE ps.user_id = $1
            ORDER BY ps.entry_time DESC
        """, user_id)
        return [dict(r) for r in records]

