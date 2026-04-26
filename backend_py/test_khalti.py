import asyncio
import httpx

async def test():
    url = "https://a.khalti.com/api/v2/epayment/initiate/"
    headers = {
        "Authorization": "Key 8f3ed80837ed4fb3aedff3c35e12428b",
        "Content-Type": "application/json"
    }
    payload = {
        "return_url": "http://localhost:5173/payment/success",
        "website_url": "http://localhost:5173",
        "amount": 1000,
        "purchase_order_id": "SPARK-2275-123456",
        "purchase_order_name": "Smart Parking Slot A1",
        "customer_info": {
            "name": "Kamal Banjade",
            "email": "kamal@example.com",
            "phone": "9800000000"
        }
    }
    
    async with httpx.AsyncClient() as client:
        print("Testing a.khalti.com...")
        resp = await client.post(url, json=payload, headers=headers)
        print(resp.status_code, resp.text)

    url2 = "https://khalti.com/api/v2/epayment/initiate/"
    async with httpx.AsyncClient() as client:
        print("Testing khalti.com...")
        resp = await client.post(url2, json=payload, headers=headers)
        print(resp.status_code, resp.text)

asyncio.run(test())
