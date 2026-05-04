from datetime import datetime, timezone
import math
import json
from app.config.db import get_pool

from app.utils.billing import calculate_amount

async def create_payment(session_id: int, amount: float, method: str = 'cash', pidx: str = None):
    pool = get_pool()
    async with pool.acquire() as conn:
        # Idempotency: don't create a duplicate pending payment
        existing = await conn.fetchrow(
            "SELECT * FROM payments WHERE session_id = $1 AND status = 'pending' ORDER BY id DESC LIMIT 1",
            session_id
        )
        if existing:
            return dict(existing)

        record = await conn.fetchrow(
            """
            INSERT INTO payments (session_id, amount, method, status, pidx)
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING *
            """,
            session_id, amount, method, pidx
        )
        return dict(record)

async def mark_paid(payment_id: int, method: str, applied_discount: float = 0, extras: dict = None):
    if extras is None:
        extras = {}
    pool = get_pool()
    from .user_service import add_loyalty_points

    async with pool.acquire() as conn:
        p = await conn.fetchrow("SELECT * FROM payments WHERE id = $1", payment_id)
        if not p:
            raise ValueError(f"Payment {payment_id} not found")

        # --- IDEMPOTENCY: Already paid ---
        if p['status'] == 'paid':
            print(f"[paymentService] Payment {payment_id} already paid. Ensuring session/slot are finalized.")
            await _finalize_session_and_slot(conn, p['session_id'])
            p_dict = dict(p)
            session_res = await conn.fetchrow("SELECT user_id FROM parking_sessions WHERE id = $1", p['session_id'])
            user_id = session_res['user_id'] if session_res else None
            p_dict['pointsAwarded'] = math.floor(float(p['amount']) / 10) if user_id else 0
            return p_dict

        final_amount = max(0, float(p['amount']) - applied_discount)

        record = await conn.fetchrow(
            """
            UPDATE payments
            SET status = 'paid',
                paid_at = NOW(),
                method = $1,
                amount = $2,
                transaction_id = $3,
                gateway_response = $4
            WHERE id = $5
            RETURNING *
            """,
            method, final_amount,
            extras.get('transaction_id'),
            json.dumps(extras.get('gateway_response')) if extras.get('gateway_response') else None,
            payment_id
        )

        # Finalize session and release slot (handles both active and already-completed sessions)
        await _finalize_session_and_slot(conn, p['session_id'])

        # Award loyalty points
        points_awarded = 0
        session_res = await conn.fetchrow("SELECT user_id FROM parking_sessions WHERE id = $1", p['session_id'])
        user_id = session_res['user_id'] if session_res else None

        if user_id:
            points_awarded = math.floor(final_amount / 10)
            if points_awarded > 0:
                await add_loyalty_points(user_id, p['session_id'], points_awarded)

        payment = dict(record)
        payment['pointsAwarded'] = points_awarded
        return payment

async def _finalize_session_and_slot(conn, session_id: int):
    """
    Ensures a session is 'completed' and its slot is 'available'.
    Safe to call multiple times (idempotent).
    """
    session = await conn.fetchrow(
        "SELECT id, slot_id, status, entry_time FROM parking_sessions WHERE id = $1",
        session_id
    )
    if not session:
        return

    slot_id = session['slot_id']

    # End the session if still active
    if session['status'] == 'active':
        entry_time = session['entry_time']
        if entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        exit_time = datetime.now(timezone.utc)
        duration_minutes = max(1, int((exit_time - entry_time).total_seconds() // 60))

        await conn.execute(
            """
            UPDATE parking_sessions
            SET exit_time = $1, duration_minutes = $2, status = 'completed'
            WHERE id = $3
            """,
            exit_time, duration_minutes, session_id
        )
        print(f"[paymentService] Session {session_id} auto-finalized on payment: {duration_minutes} min.")

    # Always force slot to 'available' — this is the critical fix for stuck slots
    try:
        from .slot_service import update_slot_status_by_id
        await update_slot_status_by_id(slot_id, 'available')
        print(f"[paymentService] Slot {slot_id} released to available.")
    except Exception as e:
        print(f"[paymentService] Error releasing slot {slot_id}: {e}")

async def get_payment_by_session(session_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT * FROM payments WHERE session_id = $1 ORDER BY id DESC LIMIT 1",
            session_id
        )
        return dict(record) if record else None
