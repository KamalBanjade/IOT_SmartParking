from app.config.db import get_pool
from .payment_service import calculate_amount
from datetime import datetime

async def start_session(slot_id: int, user_id: int = None):
    pool = get_pool()
    async with pool.acquire() as conn:
        # Check if slot already has an active session
        existing = await conn.fetchrow(
            "SELECT id, user_id FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )

        if existing:
            # If a user_id is provided and the session doesn't have one, update it
            if user_id and not existing['user_id']:
                updated = await conn.fetchrow(
                    "UPDATE parking_sessions SET user_id = $1 WHERE id = $2 RETURNING *",
                    user_id, existing['id']
                )
                return dict(updated)
            return dict(existing)

        record = await conn.fetchrow(
            """
            INSERT INTO parking_sessions (slot_id, user_id, status)
            VALUES ($1, $2, 'active')
            RETURNING *
            """,
            slot_id, user_id
        )
        return dict(record)

async def end_session(slot_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        # Find active session for this slotId
        active = await conn.fetchrow(
            "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )

        if not active:
            print(f"[sessionService] No active session found for slotId {slot_id}")
            return None

        exit_time = datetime.now()
        diff_ms = (exit_time - active['entry_time']).total_seconds() * 1000
        duration_minutes = int(diff_ms // (1000 * 60))
        amount_due = calculate_amount(active['entry_time'], exit_time)

        record = await conn.fetchrow(
            """
            UPDATE parking_sessions
            SET exit_time = $1, duration_minutes = $2, status = 'completed'
            WHERE id = $3
            RETURNING *
            """,
            exit_time, duration_minutes, active['id']
        )
        
        session = dict(record)
        session['amountDue'] = amount_due
        return session

async def get_active_session(slot_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )
        return dict(record) if record else None

async def abandon_stale_sessions():
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            UPDATE parking_sessions
            SET status = 'abandoned'
            WHERE status = 'active' AND entry_time < NOW() - INTERVAL '24 hours'
            RETURNING id
            """
        )
        count = len(records)
        if count > 0:
            print(f"[sessionService] Abandoned {count} stale sessions")
        return count
