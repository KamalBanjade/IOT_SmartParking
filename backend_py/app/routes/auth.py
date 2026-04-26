from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from app.services import auth_service, user_service, email_service
from app.middleware.auth import require_operator, require_admin, require_customer
from app.config.db import get_pool
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

class OperatorLogin(BaseModel):
    email: str
    password: str

class OperatorChangePassword(BaseModel):
    currentPassword: str
    newPassword: str

class ForgotPassword(BaseModel):
    email: Optional[str] = None
    emailOrPhone: Optional[str] = None

class ResetPassword(BaseModel):
    token: str
    password: str

class OperatorCreate(BaseModel):
    name: str
    email: str
    role: Optional[str] = "operator"

class CustomerSetupPassword(BaseModel):
    phone: str
    password: str
    confirmPassword: str

class CustomerLogin(BaseModel):
    phone: str
    password: str

# ==========================================
# OPERATOR AUTH
# ==========================================

@router.post("/operator/login")
async def operator_login(data: OperatorLogin):
    try:
        result = await auth_service.login_operator(data.email, data.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/operator/logout")
async def operator_logout(operator=Depends(require_operator)):
    return {"message": "Logged out successfully"}

@router.get("/operator/me")
async def operator_me(operator=Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow('SELECT id, name, email, role FROM operators WHERE id = $1', operator['id'])
            if not record:
                raise HTTPException(status_code=404, detail="Operator not found")
            return dict(record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/operator/change-password")
async def operator_change_password(data: OperatorChangePassword, operator=Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow('SELECT password_hash FROM operators WHERE id = $1', operator['id'])
            is_valid = auth_service.verify_password(data.currentPassword, record['password_hash'])
            if not is_valid:
                raise HTTPException(status_code=400, detail="Incorrect current password")
                
            new_hash = auth_service.hash_password(data.newPassword)
            await conn.execute('UPDATE operators SET password_hash = $1 WHERE id = $2', new_hash, operator['id'])
            return {"message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/operator/forgot-password")
async def operator_forgot_password(data: ForgotPassword):
    try:
        await auth_service.forgot_operator_password(data.email)
        return {"message": "Reset link sent to your email"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/operator/reset-password")
async def operator_reset_password(data: ResetPassword):
    try:
        await auth_service.reset_operator_password(data.token, data.password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ADMIN ONLY - OPERATOR MANAGEMENT
# ==========================================

@router.post("/operators/create")
async def operator_create(data: OperatorCreate, admin=Depends(require_admin)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            # Check email uniqueness first
            existing = await conn.fetchrow("SELECT id FROM operators WHERE email = $1", data.email)
            if existing:
                raise HTTPException(status_code=400, detail="Email already exists")
                
            record = await conn.fetchrow(
                'INSERT INTO operators (name, email, role) VALUES ($1, $2, $3) RETURNING id, name, email, role, is_active, created_at',
                data.name, data.email, data.role
            )
            operator_data = dict(record)
            
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(hours=48)
            
            await conn.execute(
                'UPDATE operators SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
                token, expires, operator_data['id']
            )
            
            await email_service.send_staff_welcome_email(data.email, data.name, token)
            
            operator_data['setupSent'] = True
            return operator_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/operators")
async def get_operators(admin=Depends(require_admin)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch('SELECT id, name, email, role, is_active, created_at, last_login FROM operators ORDER BY id')
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/operators/{id}/deactivate")
async def deactivate_operator(id: int, admin=Depends(require_admin)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow('UPDATE operators SET is_active = false WHERE id = $1 RETURNING id', id)
            if not record:
                raise HTTPException(status_code=404, detail="Operator not found")
            return {"message": "Operator deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# CUSTOMER AUTH
# ==========================================

@router.post("/customer/setup-password")
async def customer_setup_password(data: CustomerSetupPassword):
    if data.password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow('SELECT * FROM users WHERE phone = $1', data.phone)
            if not record:
                raise HTTPException(status_code=404, detail="Phone number not registered. Please visit the parking booth to register.")
            
            user = dict(record)
            if user['password_hash']:
                raise HTTPException(status_code=400, detail="Password already set. Please login instead.")
                
            await auth_service.register_customer_password(user['id'], data.password)
            
            login_data = await auth_service.login_customer(data.phone, data.password)
            return login_data
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer/login")
async def customer_login(data: CustomerLogin):
    try:
        login_data = await auth_service.login_customer(data.phone, data.password)
        points_res = await user_service.get_points_summary(login_data['customer']['id'])
        login_data['customer']['points'] = points_res
        return login_data
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customer/me")
async def customer_me(customer=Depends(require_customer)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow('SELECT id, name, phone, email, is_member, qr_token FROM users WHERE id = $1', customer['id'])
            if not record:
                raise HTTPException(status_code=404, detail="User not found")
                
            user = dict(record)
            points_summary = await user_service.get_points_summary(user['id'])
            
            return {**user, "pointsSummary": points_summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer/forgot-password")
async def customer_forgot_password(data: ForgotPassword):
    try:
        await user_service.forgot_password(data.emailOrPhone)
        return {"message": "Reset link sent to your email"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer/reset-password")
async def customer_reset_password(data: ResetPassword):
    try:
        await user_service.reset_password(data.token, data.password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
