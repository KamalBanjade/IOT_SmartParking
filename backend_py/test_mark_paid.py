import asyncio
from app.config.db import connect_db, disconnect_db, get_pool
from app.services.payment_service import mark_paid

async def t():
    await connect_db()
    try:
        payment = await mark_paid(2275, 'khalti', 0, {
            'transaction_id': '123',
            'gateway_response': {'test': 1}
        })
        print(payment)
    except Exception as e:
        print("ERROR:", e)
    finally:
        await disconnect_db()

asyncio.run(t())
