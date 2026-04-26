import asyncio
from app.config.db import connect_db, disconnect_db, get_pool

async def t():
    await connect_db()
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch("""
                SELECT ps.*, s.label as slot_label, 
                       (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY created_at DESC LIMIT 1) as amount,
                       (SELECT method FROM payments WHERE session_id = ps.id ORDER BY created_at DESC LIMIT 1) as method,
                       (SELECT status FROM payments WHERE session_id = ps.id ORDER BY created_at DESC LIMIT 1) as payment_status
                FROM parking_sessions ps
                JOIN parking_slots s ON ps.slot_id = s.id
                WHERE ps.user_id = $1
                ORDER BY ps.entry_time DESC
                LIMIT $2 OFFSET $3
            """, 3, 3, 0)
            print("Records:", records)
    except Exception as e:
        print("ERROR:", e)
    finally:
        await disconnect_db()

asyncio.run(t())
