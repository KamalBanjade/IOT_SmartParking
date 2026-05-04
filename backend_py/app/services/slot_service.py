from app.config.db import get_pool

async def get_all_slots():
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM parking_slots ORDER BY id ASC")
        return [dict(r) for r in records]

async def get_slot_by_id(slot_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow("SELECT * FROM parking_slots WHERE id = $1", slot_id)
        return dict(record) if record else None

async def get_slot_by_controller_id(controller_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow("SELECT * FROM parking_slots WHERE controller_id = $1", controller_id)
        return dict(record) if record else None

async def update_slot_status(controller_id: str, status: str):
    allowed = ['available', 'occupied']
    if status not in allowed:
        raise ValueError(f"Invalid status \"{status}\". Must be: {', '.join(allowed)}")

    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            UPDATE parking_slots
            SET status = $1, last_updated = NOW()
            WHERE controller_id = $2
            RETURNING *
            """,
            status, controller_id
        )

        if not record:
            raise ValueError(f"No slot found with controller_id \"{controller_id}\"")

        return dict(record)

async def update_slot_status_by_id(slot_id: int, status: str):
    allowed = ['available', 'occupied']
    if status not in allowed:
        raise ValueError(f"Invalid status \"{status}\". Must be: {', '.join(allowed)}")

    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            UPDATE parking_slots
            SET status = $1, last_updated = NOW()
            WHERE id = $2
            RETURNING *
            """,
            status, slot_id
        )

        if not record:
            raise ValueError(f"No slot found with ID \"{slot_id}\"")

        return dict(record)
