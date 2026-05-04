import asyncio
import os
import sys

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.config.db import connect_db, get_pool

async def run():
    try:
        await connect_db()
        pool = get_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch('SELECT id, entry_time, exit_time, status FROM parking_sessions ORDER BY id DESC LIMIT 5')
            for r in records:
                print(f"ID: {r['id']}, Entry: {r['entry_time']}, Exit: {r['exit_time']}, Status: {r['status']}")
        await pool.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
