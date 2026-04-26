import math
from app.config.db import get_pool
from app.config.settings import settings

def calculate_amount(entry_time, exit_time):
    rate = settings.PARKING_RATE_PER_HOUR
    diff_ms = (exit_time - entry_time).total_seconds() * 1000
    diff_minutes = diff_ms / (1000 * 60)
    hours = max(1, math.ceil(diff_minutes / 60))
    return round(float(hours * rate), 2)

async def create_payment(session_id: int, amount: float, method: str = 'cash', pidx: str = None):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            INSERT INTO payments (session_id, amount, method, status, pidx)
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING *
            """,
            session_id, amount, method, pidx
        )
        return dict(record)

async def mark_paid(payment_id: int, method: str, applied_discount: float = 0, extras: dict = None):
    if extras is None:
        extras = {}
    pool = get_pool()
    from .user_service import add_loyalty_points
    
    async with pool.acquire() as conn:
        p = await conn.fetchrow("SELECT * FROM payments WHERE id = $1", payment_id)
        if not p:
            raise ValueError(f"Payment {payment_id} not found")
        
        if p['status'] == 'paid':
            # Already paid, just return the record and calculate points awarded previously
            p_dict = dict(p)
            session_res = await conn.fetchrow("SELECT user_id FROM parking_sessions WHERE id = $1", p['session_id'])
            user_id = session_res['user_id'] if session_res else None
            p_dict['pointsAwarded'] = math.floor(float(p['amount']) / 10) if user_id else 0
            return p_dict
        
        final_amount = max(0, float(p['amount']) - applied_discount)
        
        import json
        record = await conn.fetchrow(
            """
            UPDATE payments
            SET status = 'paid', 
                paid_at = NOW(), 
                method = $1, 
                amount = $2,
                transaction_id = $3,
                gateway_response = $4
            WHERE id = $5
            RETURNING *
            """,
            method, final_amount, extras.get('transaction_id'), 
            json.dumps(extras.get('gateway_response')) if extras.get('gateway_response') else None, payment_id
        )
        
        points_awarded = 0
        session_res = await conn.fetchrow("SELECT user_id FROM parking_sessions WHERE id = $1", p['session_id'])
        user_id = session_res['user_id'] if session_res else None

        if user_id:
            points_awarded = math.floor(final_amount / 10)
            if points_awarded > 0:
                await add_loyalty_points(user_id, p['session_id'], points_awarded)

        payment = dict(record)
        payment['pointsAwarded'] = points_awarded
        return payment

async def get_payment_by_session(session_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow("SELECT * FROM payments WHERE session_id = $1", session_id)
        return dict(record) if record else None
