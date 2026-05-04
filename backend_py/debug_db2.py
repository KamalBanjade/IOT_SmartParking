import asyncio
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

async def heal_missing_payments():
    from app.config.db import connect_db, get_pool
    from app.utils.billing import calculate_amount
    await connect_db()
    pool = get_pool()
    async with pool.acquire() as conn:
        # Find all completed sessions that DO NOT have a payment record
        records = await conn.fetch("""
            SELECT ps.* 
            FROM parking_sessions ps
            LEFT JOIN payments p ON ps.id = p.session_id
            WHERE ps.status = 'completed' AND p.id IS NULL
        """)
        
        for r in records:
            amount = calculate_amount(r['entry_time'], r['exit_time'] or datetime.now(timezone.utc))
            print(f"Creating missing payment for session {r['id']} (Amount: {amount})")
            await conn.execute(
                """
                INSERT INTO payments (session_id, amount, method, status)
                VALUES ($1, $2, 'cash', 'pending')
                """,
                r['id'], amount
            )
            
        print(f"Done. Fixed {len(records)} sessions.")

if __name__ == '__main__':
    asyncio.run(heal_missing_payments())
