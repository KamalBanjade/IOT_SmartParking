import asyncio
from app.config.db import connect_db, disconnect_db, get_pool
from app.services import session_service

async def test():
    await connect_db()
    try:
        # Assuming slot A1 is slot_id=1
        session = await session_service.get_active_session(1)
        print("Session 1:", session)
        session = await session_service.get_active_session(2)
        print("Session 2:", session)
        session = await session_service.get_active_session(3)
        print("Session 3:", session)
    finally:
        await disconnect_db()

asyncio.run(test())
