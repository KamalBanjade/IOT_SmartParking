import asyncpg
from app.config.settings import settings

pool = None

async def connect_db():
    global pool
    pool = await asyncpg.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        min_size=2,
        max_size=10
    )
    print(f"Database connected -> {settings.DB_NAME}@{settings.DB_HOST}")
    return pool

async def disconnect_db():
    global pool
    if pool:
        await pool.close()

def get_pool():
    return pool
