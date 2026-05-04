from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from app.services import payment_service, khalti_service, user_service
from app.middleware.auth import require_operator, require_customer, optional_auth
from app.config.db import get_pool

router = APIRouter(prefix="/api/payments", tags=["payments"])

class PayModel(BaseModel):
    method: str
    appliedDiscount: Optional[float] = 0.0

class VerifyModel(BaseModel):
    pidx: str
    paymentId: int

@router.post("/khalti/verify")
async def verify_khalti_payment(data: VerifyModel, request: Request, auth=Depends(optional_auth)):
    try:
        verify_res = await khalti_service.verify_payment(data.pidx)
        
        if verify_res.get('status') == 'Completed':
            payment = await payment_service.mark_paid(data.paymentId, 'khalti', 0, {
                'transaction_id': verify_res.get('transaction_id'),
                'gateway_response': verify_res
            })
            
            try:
                pool = get_pool()
                async with pool.acquire() as conn:
                    ps = await conn.fetchrow("""
                        SELECT s.id as slot_id, s.label as slot_label, s.controller_id, u.name as member_name
                        FROM parking_sessions ps
                        JOIN parking_slots s ON ps.slot_id = s.id
                        LEFT JOIN users u ON ps.user_id = u.id
                        WHERE ps.id = $1
                    """, payment['session_id'])
                    
                sio = getattr(request.app.state, "sio", None)
                if sio and ps:
                    await sio.emit("paymentConfirmed", {
                        "paymentId": payment['id'],
                        "sessionId": payment['session_id'],
                        "slotId": ps['slot_id'],
                        "slotLabel": ps['slot_label'],
                        "amount": float(payment['amount']),
                        "method": "khalti",
                        "pointsAwarded": payment.get('pointsAwarded', 0),
                        "memberName": ps['member_name']
                    })
                    
                    await sio.emit("slotUpdated", {
                        "id": ps['slot_id'],
                        "controllerId": ps['controller_id'],
                        "label": ps['slot_label'],
                        "status": "available"
                    })
            except Exception as e:
                print(f"[khaltiVerify] Socket notification failed: {e}")

            return {
                "success": True, 
                "amount": verify_res.get('total_amount', 0) / 100, 
                "pointsAwarded": payment.get('pointsAwarded', 0)
            }
        else:
            return {"success": False, "status": verify_res.get('status')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}")
async def get_payment(session_id: int, operator=Depends(require_operator)):
    try:
        payment = await payment_service.get_payment_by_session(session_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/status")
async def get_payment_status(id: int, auth=Depends(optional_auth)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            record = await conn.fetchrow("SELECT id, status, amount, method, pidx, paid_at FROM payments WHERE id = $1", id)
            if not record:
                raise HTTPException(status_code=404, detail="Payment not found")
            return dict(record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/pay")
async def pay_payment(id: int, data: PayModel, request: Request, operator=Depends(require_operator)):
    try:
        payment = await payment_service.mark_paid(id, data.method, data.appliedDiscount)
        
        try:
            # Emit socket events for cash payment too
            pool = get_pool()
            async with pool.acquire() as conn:
                ps = await conn.fetchrow("""
                    SELECT s.id as slot_id, s.label as slot_label, s.controller_id, u.name as member_name
                    FROM parking_sessions ps
                    JOIN parking_slots s ON ps.slot_id = s.id
                    LEFT JOIN users u ON ps.user_id = u.id
                    WHERE ps.id = $1
                """, payment['session_id'])
                
            sio = getattr(request.app.state, "sio", None)
            if sio and ps:
                await sio.emit("paymentConfirmed", {
                    "paymentId": payment['id'],
                    "sessionId": payment['session_id'],
                    "slotId": ps['slot_id'],
                    "slotLabel": ps['slot_label'],
                    "amount": float(payment['amount']),
                    "method": data.method,
                    "pointsAwarded": payment.get('pointsAwarded', 0),
                    "memberName": ps['member_name']
                })
                
                await sio.emit("slotUpdated", {
                    "id": ps['slot_id'],
                    "controllerId": ps['controller_id'],
                    "label": ps['slot_label'],
                    "status": "available"
                })
        except Exception as e:
            print(f"[paymentsRoute] Socket emission failed: {e}")

        return {
            "payment": payment,
            "pointsAwarded": payment.get('pointsAwarded', 0)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/khalti/initiate")
async def initiate_khalti(id: int, operator=Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            query = """
                SELECT p.*, ps.slot_id, s.label as slot_label, ps.user_id 
                FROM payments p
                JOIN parking_sessions ps ON p.session_id = ps.id
                JOIN parking_slots s ON ps.slot_id = s.id
                WHERE p.id = $1
            """
            record = await conn.fetchrow(query, id)
            if not record:
                raise HTTPException(status_code=404, detail="Payment not found")
                
            data = dict(record)
            
            # --- GUARD: Prevent double payment ---
            if data['status'] == 'paid':
                raise HTTPException(status_code=400, detail="Payment already completed for this session")
            
            customer_info = {}
            if data['user_id']:
                user = await user_service.get_user_by_id(data['user_id'])
                if user:
                    customer_info = {"name": user['name'], "phone": user['phone']}
                    
            initiate_res = await khalti_service.initiate_payment(
                id, float(data['amount']), data['slot_label'], customer_info
            )
            
            await conn.execute('UPDATE payments SET pidx = $1 WHERE id = $2', initiate_res['pidx'], id)
            
            return {
                "paymentUrl": initiate_res['payment_url'],
                "pidx": initiate_res['pidx']
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/customer/initiate")
async def customer_initiate_payment(id: int, customer=Depends(require_customer)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            payment = await conn.fetchrow("""
                SELECT p.*, s.user_id, s.slot_id, ps.label as slot_label
                FROM payments p
                JOIN parking_sessions s ON p.session_id = s.id
                JOIN parking_slots ps ON s.slot_id = ps.id
                WHERE p.id = $1
            """, id)
            
            if not payment:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            if payment['user_id'] != customer['id']:
                raise HTTPException(status_code=403, detail="This payment does not belong to you")
            
            if payment['status'] == 'paid':
                raise HTTPException(status_code=400, detail="Payment already completed")

            # Get user info
            user = await user_service.get_user_by_id(customer['id'])
            customer_info = {
                "name": user['name'] if user else "Customer",
                "email": user['email'] if user and user.get('email') else "member@smartparking.np",
                "phone": user['phone'] if user else ""
            }

            initiate_res = await khalti_service.initiate_payment(
                id, float(payment['amount']), payment['slot_label'], customer_info
            )
            
            await conn.execute('UPDATE payments SET pidx = $1 WHERE id = $2', initiate_res['pidx'], id)
            
            return {
                "payment_url": initiate_res['payment_url'],
                "pidx": initiate_res['pidx'],
                "paymentId": payment['id'],
                "amount": payment['amount']
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
