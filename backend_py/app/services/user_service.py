import qrcode
import io
import base64
import secrets
from datetime import datetime, timedelta
from nanoid import generate
from app.config.db import get_pool
from . import email_service
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_qr_image(token: str) -> str:
    img = qrcode.make(token)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"

async def register_user(name: str, phone: str, email: str = None, is_member: bool = False):
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow('SELECT id FROM users WHERE phone = $1', phone)
        if existing:
            raise ValueError(f"User with phone {phone} already exists")

        qr_token = generate(size=16)
        record = await conn.fetchrow(
            'INSERT INTO users (name, phone, email, is_member, qr_token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            name, phone, email, is_member, qr_token
        )
        
        user = dict(record)
        qr_code_image = generate_qr_image(qr_token) if is_member else None

        if email:
            try:
                reset_token = secrets.token_hex(32)
                reset_expires = datetime.now() + timedelta(hours=24)
                await conn.execute(
                    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
                    reset_token, reset_expires, user['id']
                )
                await email_service.send_reset_email(email, name, reset_token, True)
            except Exception as email_err:
                print(f"[userService] Failed to send welcome email: {email_err}")

        return {"user": user, "qrCodeImage": qr_code_image}

async def get_user_by_qr_token(qr_token: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow('SELECT * FROM users WHERE qr_token = $1', qr_token)
        return dict(record) if record else None

async def get_user_by_id(user_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            SELECT u.*, COALESCE(SUM(lp.points), 0) as total_points
            FROM users u
            LEFT JOIN loyalty_points lp ON u.id = lp.user_id
            WHERE u.id = $1
            GROUP BY u.id
            """, 
            user_id
        )
        if not record: return None
        d = dict(record)
        d['total_points'] = int(d['total_points'])
        return d

async def regenerate_qr_token(user_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        new_token = generate(size=16)
        record = await conn.fetchrow(
            'UPDATE users SET qr_token = $1 WHERE id = $2 RETURNING *',
            new_token, user_id
        )
        if not record:
            raise ValueError('User not found')
        
        qr_code_image = generate_qr_image(new_token)
        return {"qrToken": new_token, "qrCodeImage": qr_code_image}

async def add_loyalty_points(user_id: int, session_id: int, points: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'INSERT INTO loyalty_points (user_id, session_id, points) VALUES ($1, $2, $3) RETURNING *',
            user_id, session_id, points
        )
        return dict(record)

async def get_loyalty_points(user_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'SELECT SUM(points) as total_points FROM loyalty_points WHERE user_id = $1',
            user_id
        )
        return int(record['total_points'] or 0)

async def get_points_summary(user_id: int):
    total = await get_loyalty_points(user_id)
    next_reward_at = 50
    progress = min(100, int((total / next_reward_at) * 100))
    discount_available = total >= 50
    
    return {
        "total": total,
        "nextRewardAt": next_reward_at,
        "progress": progress,
        "discountAvailable": discount_available,
        "discountAmount": 25 if discount_available else 0
    }

async def apply_discount(user_id: int, session_id: int):
    total = await get_loyalty_points(user_id)
    if total < 50:
        raise ValueError('Insufficient points for discount')
    
    await add_loyalty_points(user_id, session_id, -50)
    return 25

async def search_users(query: str):
    pool = get_pool()
    search_term = f"%{query}%"
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            SELECT u.*, 
              COALESCE(SUM(lp.points), 0) as total_points,
              (SELECT MAX(entry_time) FROM parking_sessions WHERE user_id = u.id) as last_visit
             FROM users u
             LEFT JOIN loyalty_points lp ON u.id = lp.user_id
             WHERE u.name ILIKE $1 OR u.phone ILIKE $1
             GROUP BY u.id
             ORDER BY u.name ASC
             LIMIT 10
            """,
            search_term
        )
        results = []
        for r in records:
            d = dict(r)
            d['total_points'] = int(d['total_points'])
            results.append(d)
        return results

async def forgot_password(email_or_phone: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'SELECT id, name, email FROM users WHERE email = $1 OR phone = $1',
            email_or_phone
        )
        if not record:
            raise ValueError('User not found')
        
        user = dict(record)
        if not user['email']:
            raise ValueError('User has no email registered')
        
        token = secrets.token_hex(32)
        expires = datetime.now() + timedelta(hours=1)
        
        await conn.execute(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            token, expires, user['id']
        )
        
        await email_service.send_reset_email(user['email'], user['name'], token, False)
        return True

async def reset_password(token: str, new_password: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            token
        )
        
        if not record:
            raise ValueError('Invalid or expired reset token')
        
        user_id = record['id']
        hash_pass = pwd_context.hash(new_password)
        
        await conn.execute(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            hash_pass, user_id
        )
        return True

async def get_all_users():
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            SELECT u.*, 
              COALESCE(SUM(lp.points), 0) as total_points,
              (SELECT MAX(entry_time) FROM parking_sessions WHERE user_id = u.id) as last_visit
             FROM users u
             LEFT JOIN loyalty_points lp ON u.id = lp.user_id
             GROUP BY u.id
             ORDER BY u.created_at DESC
            """
        )
        results = []
        for r in records:
            d = dict(r)
            d['total_points'] = int(d['total_points'])
            results.append(d)
        return results

async def update_user(user_id: int, data: dict):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
            data.get('name'), data.get('email'), data.get('phone'), user_id
        )
        if not record:
            raise ValueError('User not found')
        return dict(record)

async def delete_user(user_id: int):
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute('DELETE FROM loyalty_points WHERE user_id = $1', user_id)
            await conn.execute('DELETE FROM users WHERE id = $1', user_id)
        return True
