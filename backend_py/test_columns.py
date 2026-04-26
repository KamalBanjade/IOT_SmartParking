import asyncio
from app.config.db import connect_db, disconnect_db, get_pool

async def t():
    await connect_db()
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'parking_sessions'")
            for r in records:
                print(dict(r))
    except Exception as e:
        print("ERROR:", e)
    finally:
        await disconnect_db()

asyncio.run(t())
