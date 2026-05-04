from app.config.db import get_pool
from app.utils.billing import calculate_amount
from datetime import datetime, timezone

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

async def get_session_bill(slot_id: int):
    """
    Returns the ACTIVE session for a slot and calculates current amount due.
    CRITICAL: This function ONLY returns active sessions.
    Returning completed sessions would cause duplicate payment creation.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        active = await conn.fetchrow(
            "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )

        if not active:
            return None

        exit_time = datetime.now(timezone.utc)
        amount_due = calculate_amount(active['entry_time'], exit_time)
        
        session = dict(active)
        session['amountDue'] = amount_due
        session['exit_time'] = exit_time  # Snapshot of when "End Session" was clicked
        return session

async def end_session(slot_id: int):
    """End the active session for a specific slot (called by MQTT on physical departure)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        active_sessions = await conn.fetch(
            "SELECT id FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )
        if active_sessions:
            result = None
            for active in active_sessions:
                result = await end_session_by_id(active['id'])
                print(f"[sessionService] Auto-ended session {active['id']} for slot {slot_id} on physical departure.")
            return result
        else:
            # No active session — slot may be stuck as 'occupied' due to a previous crash.
            # Force-release the slot to 'available' anyway.
            print(f"[sessionService] No active session for slot {slot_id}, force-releasing slot.")
            try:
                from .slot_service import update_slot_status_by_id
                await update_slot_status_by_id(slot_id, 'available')
            except Exception as e:
                print(f"[sessionService] Force-release slot error: {e}")
            return None

async def end_session_by_id(session_id: int):
    """
    Finalize a session by ID. Sets exit_time, duration, status=completed.
    ALWAYS releases the slot to 'available', even if already completed.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT * FROM parking_sessions WHERE id = $1",
            session_id
        )
        if not session:
            return None

        slot_id = session['slot_id']

        # Only update the session record if it's still active
        if session['status'] == 'active':
            exit_time = datetime.now(timezone.utc)
            
            entry_time = session['entry_time']
            if entry_time.tzinfo is None:
                exit_time = datetime.now()
            else:
                exit_time = datetime.now(timezone.utc)
                
            diff_seconds = (exit_time - entry_time).total_seconds()
            duration_minutes = max(1, int(diff_seconds // 60))  # Minimum 1 minute
            
            from app.utils.billing import calculate_amount
            amount_due = calculate_amount(entry_time, exit_time)
            
            await conn.execute(
                """
                UPDATE parking_sessions
                SET exit_time = $1, duration_minutes = $2, status = 'completed'
                WHERE id = $3
                """,
                exit_time, duration_minutes, session_id
            )
            
            # Create a pending payment if none exists
            existing_payment = await conn.fetchrow(
                "SELECT id FROM payments WHERE session_id = $1",
                session_id
            )
            if not existing_payment and amount_due >= 0:
                await conn.execute(
                    """
                    INSERT INTO payments (session_id, amount, method, status)
                    VALUES ($1, $2, 'cash', 'pending')
                    """,
                    session_id, amount_due
                )
                
            print(f"[sessionService] Session {session_id} finalized: {duration_minutes} min. Amount: {amount_due}")
        
        # ALWAYS release the slot regardless of session state.
        # This handles the case where slot is stuck as 'occupied' even after session ended.
        try:
            from .slot_service import update_slot_status_by_id
            await update_slot_status_by_id(slot_id, 'available')
        except Exception as e:
            print(f"[sessionService] Error updating slot status: {e}")

        return True

async def get_active_session(slot_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        # First, try to find a truly active session
        record = await conn.fetchrow(
            "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
            slot_id
        )
        if record:
            session = dict(record)
            # Attach live amount due
            session['amountDue'] = calculate_amount(session['entry_time'], datetime.now(timezone.utc))
            return session
            
        return None

async def abandon_stale_sessions():
    """
    Marks sessions as abandoned if they've been active for more than 24 hours.
    Also force-releases those slots.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            UPDATE parking_sessions
            SET status = 'abandoned', exit_time = NOW(), duration_minutes = EXTRACT(EPOCH FROM (NOW() - entry_time))::int / 60
            WHERE status = 'active' AND entry_time < NOW() - INTERVAL '24 hours'
            RETURNING id, slot_id
            """
        )
        count = len(records)
        if count > 0:
            print(f"[sessionService] Abandoned {count} stale sessions.")
            # Release all those slots
            for r in records:
                try:
                    from .slot_service import update_slot_status_by_id
                    await update_slot_status_by_id(r['slot_id'], 'available')
                except Exception as e:
                    print(f"[sessionService] Error releasing slot {r['slot_id']}: {e}")
        return count
