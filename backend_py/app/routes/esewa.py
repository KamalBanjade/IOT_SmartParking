from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services import esewa_service, payment_service
from app.config.db import get_pool
from typing import Optional

router = APIRouter(prefix="/api/esewa", tags=["esewa"])

class EsewaInitiateModel(BaseModel):
    amount: float
    tax_amount: float = 0
    product_service_charge: float = 0
    product_delivery_charge: float = 0
    payment_id: Optional[int] = None

@router.post("/initiate")
async def initiate_esewa(data: EsewaInitiateModel):
    try:
        # Default payment_id to 0 or use the provided one
        pid = data.payment_id if data.payment_id else 0
        form_data = esewa_service.create_esewa_form_data(data.amount, pid)
        
        if pid:
            pool = get_pool()
            async with pool.acquire() as conn:
                await conn.execute('UPDATE payments SET pidx = $1 WHERE id = $2', form_data['transaction_uuid'], pid)
        
        return form_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/initiate-by-id/{payment_id}")
async def initiate_esewa_by_id(payment_id: int):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            payment = await conn.fetchrow('SELECT id, amount, status FROM payments WHERE id = $1', payment_id)
            if not payment:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            # --- GUARD: Prevent double payment ---
            if payment['status'] == 'paid':
                raise HTTPException(status_code=400, detail="Payment already completed for this session")
            
            form_data = esewa_service.create_esewa_form_data(float(payment['amount']), payment_id)
            await conn.execute('UPDATE payments SET pidx = $1 WHERE id = $2', form_data['transaction_uuid'], payment_id)
            
        return form_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify")
async def verify_esewa(data: str, request: Request):
    try:
        from urllib.parse import unquote
        # Ensure we have the raw base64 string — FastAPI/Starlette may or may not
        # have already URL-decoded the param, so we normalise here.
        raw_data = unquote(data)
        print(f"[ESEWA] Received verification request with data (first 60): {raw_data[:60]}...")
        verify_res = await esewa_service.verify_payment(raw_data)
        
        if verify_res.get('success'):
            transaction_uuid = verify_res['transaction_uuid']
            print(f"[ESEWA] Verification successful for UUID: {transaction_uuid}")
            
            # Extract payment_id from transaction_uuid (format: ord-<uuid>-<payment_id>)
            parts = transaction_uuid.split('-')
            payment_id = None
            if len(parts) >= 3 and parts[-1].isdigit():
                payment_id = int(parts[-1])
            
            if payment_id:
                print(f"[ESEWA] Marking payment {payment_id} as paid")
                payment = await payment_service.mark_paid(payment_id, 'esewa', 0, {
                    'transaction_id': verify_res.get('transaction_code'),
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
                        print(f"[ESEWA] Emitting success events for slot {ps['slot_label']}")
                        await sio.emit("paymentConfirmed", {
                            "paymentId": payment['id'],
                            "sessionId": payment['session_id'],
                            "slotId": ps['slot_id'],
                            "slotLabel": ps['slot_label'],
                            "amount": float(payment['amount']),
                            "method": "esewa",
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
                    print(f"[ESEWA] Socket notification failed: {e}")
                else:
                    print(f"[ESEWA] Warning: SIO or Session data not found for emission")
            else:
                print(f"[ESEWA] Warning: Could not extract payment_id from UUID: {transaction_uuid}")

            return {
                "success": True, 
                "transaction_code": verify_res.get('transaction_code'),
                "status": "COMPLETE",
                "payment_id": payment_id
            }
        else:
            print(f"[ESEWA] Verification returned failure status")
            return {"success": False, "status": "FAILED"}
    except Exception as e:
        print(f"[ESEWA] Route Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
