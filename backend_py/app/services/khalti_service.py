import httpx
import time
from app.config.settings import settings

async def initiate_payment(payment_id: int, amount: float, slot_label: str, customer_info: dict):
    url = f"{settings.KHALTI_BASE_URL}initiate/"
    headers = {
        "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "return_url": f"{settings.frontend_url}/payment/success",
        "website_url": settings.frontend_url,
        "amount": int(amount * 100), # Convert NPR to paisa
        "purchase_order_id": f"SPARK-{payment_id}-{int(time.time())}",
        "purchase_order_name": f"Smart Parking Slot {slot_label}",
        "customer_info": {
            "name": customer_info.get('name', 'Guest Customer'),
            "email": customer_info.get('email', 'customer@example.com'),
            "phone": customer_info.get('phone', '9800000000')
        }
    }
    
    print(f"[khaltiService] Initiating payment: {payload['purchase_order_id']}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

async def verify_payment(pidx: str):
    url = f"{settings.KHALTI_BASE_URL}lookup/"
    headers = {
        "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json={"pidx": pidx}, headers=headers)
        
        try:
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            # Khalti often returns 400 for Expired/Canceled/NotFound but with a valid JSON body containing status
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if "status" in error_data:
                        print(f"[khaltiService] Lookup returned 400 but has status: {error_data['status']}")
                        return error_data
                except Exception:
                    pass
            raise e
