import hmac
import hashlib
import base64
import json
import uuid
import httpx
from fastapi import HTTPException
from app.config.settings import settings

def generate_signature(total_amount: str, transaction_uuid: str, product_code: str) -> str:
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    secret = settings.ESEWA_SECRET_KEY.encode("utf-8")
    sig = base64.b64encode(hmac.new(secret, message.encode("utf-8"), hashlib.sha256).digest()).decode()
    return sig

def create_esewa_form_data(amount: float, payment_id: int):
    # eSewa requires amounts to be exact, no decimals if possible, but float is fine if matching
    tax_amount = 0
    product_service_charge = 0
    product_delivery_charge = 0
    total_amount = amount + tax_amount + product_service_charge + product_delivery_charge
    
    transaction_uuid = f"ord-{str(uuid.uuid4().hex)[:8]}-{payment_id}"
    
    # Format amounts as strings to ensure they aren't modified by JSON/Javascript
    # eSewa v2 is very sensitive to the exact string representation
    amt_str = str(int(amount)) if amount == int(amount) else str(amount)
    total_amt_str = str(int(total_amount)) if total_amount == int(total_amount) else str(total_amount)
    
    signature = generate_signature(total_amt_str, transaction_uuid, settings.ESEWA_PRODUCT_CODE)
    
    success_url = f"{settings.frontend_url}/payment/success"
    failure_url = f"{settings.frontend_url}/payment/failure"
    
    return {
        "amount": amt_str,
        "tax_amount": str(tax_amount),
        "total_amount": total_amt_str,
        "transaction_uuid": transaction_uuid,
        "product_code": settings.ESEWA_PRODUCT_CODE,
        "product_service_charge": str(product_service_charge),
        "product_delivery_charge": str(product_delivery_charge),
        "success_url": success_url,
        "failure_url": failure_url,
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
        "payment_url": settings.ESEWA_PAYMENT_URL
    }

async def verify_payment(data: str):
    try:
        decoded_bytes = base64.b64decode(data)
        decoded_str = decoded_bytes.decode("utf-8")
        decoded = json.loads(decoded_str)
    except Exception as e:
        print(f"[ESEWA] Decode error: {e}")
        raise ValueError(f"Invalid base64 data: {str(e)}")

    print(f"[ESEWA] Received verification data: {decoded}")

    transaction_code = decoded.get("transaction_code")
    status = decoded.get("status")
    total_amount = decoded.get("total_amount")
    transaction_uuid = decoded.get("transaction_uuid")
    product_code = decoded.get("product_code")
    signed_field_names = decoded.get("signed_field_names")
    signature = decoded.get("signature")

    if not all([status, total_amount, transaction_uuid, product_code, signed_field_names, signature]):
        raise ValueError("Missing required fields in decoded data")

    # Verify signature
    fields = signed_field_names.split(",")
    message_parts = []
    for field in fields:
        val = decoded.get(field, "")
        # eSewa might send numbers as numeric types or strings
        message_parts.append(f"{field}={val}")
    
    message = ",".join(message_parts)
    print(f"[ESEWA] Verification message: {message}")
    
    secret = settings.ESEWA_SECRET_KEY.encode("utf-8")
    expected_sig = base64.b64encode(hmac.new(secret, message.encode("utf-8"), hashlib.sha256).digest()).decode()

    if signature != expected_sig:
        print(f"[ESEWA] Signature mismatch! Expected: {expected_sig}, Got: {signature}")
        # Some eSewa versions might use a different message format for response
        # Let's try one more common format just in case
        raise ValueError("Signature mismatch")

    # Double-confirm via eSewa Status Check API
    # Note: status check URL for sandbox might need the product_code and total_amount
    check_url = f"{settings.ESEWA_STATUS_URL}?product_code={product_code}&total_amount={total_amount}&transaction_uuid={transaction_uuid}"
    print(f"[ESEWA] Checking status at: {check_url}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(check_url)
            response.raise_for_status()
            status_data = response.json()
            print(f"[ESEWA] Status API response: {status_data}")
            
            if status_data.get("status") != "COMPLETE":
                raise ValueError(f"Transaction not complete in eSewa system: {status_data.get('status')}")
        except Exception as e:
            print(f"[ESEWA] Status check failed: {e}")
            raise ValueError(f"Status check failed: {str(e)}")

    return {
        "success": True,
        "transaction_code": transaction_code,
        "status": status,
        "total_amount": float(str(total_amount).replace(',', '')),
        "transaction_uuid": transaction_uuid
    }
