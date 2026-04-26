from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional
from app.services import user_service
from app.middleware.auth import require_operator, require_customer, optional_operator, optional_customer
from app.config.db import get_pool

router = APIRouter(prefix="/api/users", tags=["users"])

class RegisterModel(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    isMember: Optional[bool] = False

class ScanModel(BaseModel):
    qrToken: str

class ApplyDiscountModel(BaseModel):
    sessionId: int

class UpdateUserModel(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str

@router.post("/register")
async def register(data: RegisterModel, operator=Depends(require_operator)):
    try:
        result = await user_service.register_user(data.name, data.phone, data.email, data.isMember)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_all_unified(role: str = "all", operator=Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            customer_q = """
                SELECT u.id, u.name, u.phone, u.email, 'customer' as role,
                       u.created_at, u.qr_token, u.is_member,
                       COALESCE((SELECT SUM(lp.points) FROM loyalty_points lp WHERE lp.user_id = u.id), 0) as total_points,
                       (SELECT MAX(ps.entry_time) FROM parking_sessions ps WHERE ps.user_id = u.id) as last_visit
                FROM users u
            """
            staff_q = """
                SELECT o.id, o.name, null as phone, o.email, o.role,
                       o.created_at, null as qr_token, false as is_member,
                       0 as total_points, o.last_login as last_visit
                FROM operators o
            """

            rows = []
            if role == 'customer':
                records = await conn.fetch(customer_q + " ORDER BY created_at DESC")
                rows = [dict(r) for r in records]
            elif role in ['operator', 'admin']:
                records = await conn.fetch(staff_q + " WHERE role = $1 ORDER BY created_at DESC", role)
                rows = [dict(r) for r in records]
            elif role == 'staff':
                records = await conn.fetch(staff_q + " ORDER BY created_at DESC")
                rows = [dict(r) for r in records]
            else:
                cust_recs = await conn.fetch(customer_q)
                staff_recs = await conn.fetch(staff_q)
                rows = [dict(r) for r in cust_recs] + [dict(r) for r in staff_recs]
                rows.sort(key=lambda x: x['created_at'], reverse=True)
            
            # Clean up types for JSON
            for row in rows:
                if row.get('total_points') is not None:
                    row['total_points'] = int(row['total_points'])
            
            return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_users(operator=Depends(require_operator)):
    try:
        users = await user_service.get_all_users()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_users(q: str = "", operator=Depends(require_operator)):
    try:
        users = await user_service.search_users(q)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my/profile")
async def get_my_profile(customer=Depends(require_customer)):
    try:
        user = await user_service.get_user_by_id(customer['id'])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        pool = get_pool()
        async with pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_sessions,
                    COALESCE(SUM(p.amount), 0) as total_spent
                FROM parking_sessions s
                LEFT JOIN payments p ON s.id = p.session_id AND p.status = 'paid'
                WHERE s.user_id = $1
            """, customer['id'])
        
        points_summary = await user_service.get_points_summary(customer['id'])
        return {
            **user, 
            "pointsSummary": points_summary,
            "stats": {
                "totalSessions": stats['total_sessions'],
                "totalSpent": float(stats['total_spent'])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scan")
async def scan_qr(data: ScanModel, operator=Depends(require_operator)):
    try:
        user = await user_service.get_user_by_qr_token(data.qrToken)
        if not user:
            raise HTTPException(status_code=404, detail="Invalid QR Token")
        
        points = await user_service.get_points_summary(user['id'])
        return {
            "user": user, 
            "loyaltyPoints": points['total'], 
            "pointsSummary": points
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_user(id: int, operator=Depends(require_operator)):
    try:
        user = await user_service.get_user_by_id(id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/regenerate-qr")
async def regenerate_qr(id: int, operator=Depends(require_operator)):
    try:
        result = await user_service.regenerate_qr_token(id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/points")
async def get_points(id: int, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # We will just assume if they hit this, they are authorized properly based on optional_operator/optional_customer
    # For a robust implementation we verify if it's the right customer or any operator
    from app.services.auth_service import verify_token
    try:
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload.get("type") == "customer" and payload.get("id") != id:
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")
        
    try:
        points = await user_service.get_loyalty_points(id)
        return {"totalPoints": points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/points-summary")
async def get_points_summary(id: int, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=403, detail="Access denied")
    from app.services.auth_service import verify_token
    try:
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload.get("type") == "customer" and payload.get("id") != id:
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")
        
    try:
        summary = await user_service.get_points_summary(id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/apply-discount")
async def apply_discount(id: int, data: ApplyDiscountModel, operator=Depends(require_operator)):
    try:
        discount_amount = await user_service.apply_discount(id, data.sessionId)
        return {"discountAmount": discount_amount}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_user(id: int, data: UpdateUserModel, operator=Depends(require_operator)):
    try:
        user = await user_service.update_user(id, data.dict())
        return user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_user(id: int, operator=Depends(require_operator)):
    try:
        await user_service.delete_user(id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
