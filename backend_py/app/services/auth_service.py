from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config.db import get_pool
from app.config.settings import settings
import secrets
from . import email_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def generate_operator_token(operator: dict) -> str:
    payload = {
        "id": operator["id"],
        "email": operator["email"],
        "role": operator["role"],
        "type": "operator",
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_OPERATOR_EXPIRES)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def generate_customer_token(customer: dict) -> str:
    payload = {
        "id": customer["id"],
        "phone": customer["phone"],
        "type": "customer",
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_CUSTOMER_EXPIRES)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])

async def login_operator(email: str, password: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow('SELECT * FROM operators WHERE email = $1', email)
        if not record:
            raise ValueError('Invalid credentials')
        
        operator = dict(record)
        if not operator['is_active']:
            raise ValueError('Account disabled')
        
        if not verify_password(password, operator['password_hash']):
            raise ValueError('Invalid credentials')
        
        await conn.execute('UPDATE operators SET last_login = NOW() WHERE id = $1', operator['id'])
        
        operator_data = {k: v for k, v in operator.items() if k != 'password_hash'}
        token = generate_operator_token(operator_data)
        
        return {"operator": operator_data, "token": token}

async def login_customer(phone: str, password: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow('SELECT * FROM users WHERE phone = $1', phone)
        if not record:
            raise ValueError('Invalid credentials')
        
        customer = dict(record)
        if not customer['password_hash']:
            raise ValueError('Please set a password first')
        if not customer.get('is_active', True):
            raise ValueError('Account disabled')
        
        if not verify_password(password, customer['password_hash']):
            raise ValueError('Invalid credentials')
        
        customer_data = {k: v for k, v in customer.items() if k != 'password_hash'}
        token = generate_customer_token(customer_data)
        
        return {"customer": customer_data, "token": token}

async def register_customer_password(user_id: int, password: str):
    if len(password) < 8 or not any(char.isdigit() for char in password):
        raise ValueError('Password must be at least 8 characters and contain a number')
    
    hash_pass = hash_password(password)
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, phone, email, is_member',
            hash_pass, user_id
        )
        return dict(record)

async def forgot_operator_password(email: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow('SELECT id, name FROM operators WHERE email = $1', email)
        if not record:
            raise ValueError('Operator not found')
        
        operator = dict(record)
        token = secrets.token_hex(32)
        expires = datetime.now() + timedelta(hours=1)
        
        await conn.execute(
            'UPDATE operators SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            token, expires, operator['id']
        )
        
        await email_service.send_operator_reset_email(email, operator['name'], token)
        return True

async def reset_operator_password(token: str, new_password: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            'SELECT id FROM operators WHERE reset_token = $1 AND reset_token_expires > NOW()',
            token
        )
        if not record:
            raise ValueError('Invalid or expired reset token')
        
        operator_id = record['id']
        hash_pass = hash_password(new_password)
        
        await conn.execute(
            'UPDATE operators SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            hash_pass, operator_id
        )
        return True
