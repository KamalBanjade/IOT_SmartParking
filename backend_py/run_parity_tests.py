import requests
import json
import time

BASE_URL = "http://localhost:3000"

def test_1_health():
    print("TEST 1 - Health check")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Status: {resp.status_code}")
        print(f"Body: {resp.json()}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_2_docs():
    print("\nTEST 2 - Swagger docs")
    try:
        resp = requests.get(f"{BASE_URL}/docs")
        print(f"Status: {resp.status_code}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_3_login():
    print("\nTEST 3 - Operator login")
    try:
        payload = {"email": "admin@smartparking.np", "password": "Admin@1234"}
        resp = requests.post(f"{BASE_URL}/api/auth/operator/login", json=payload)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Body: {data}")
        if resp.status_code == 200:
            return data["token"]
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_4_protected(token):
    print("\nTEST 4 - Protected route")
    try:
        print("Testing with no token...")
        resp_no_token = requests.get(f"{BASE_URL}/api/slots")
        print(f"Status (no token): {resp_no_token.status_code}")
        
        print("Testing with token...")
        headers = {"Authorization": f"Bearer {token}"}
        resp_with_token = requests.get(f"{BASE_URL}/api/slots", headers=headers)
        print(f"Status (with token): {resp_with_token.status_code}")
        print(f"Slots count: {len(resp_with_token.json())}")
        
        return resp_no_token.status_code == 401 and resp_with_token.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def run_tests():
    t1 = test_1_health()
    t2 = test_2_docs()
    token = test_3_login()
    if token:
        t4 = test_4_protected(token)
    else:
        t4 = False
        print("Skipping TEST 4 due to login failure")
    
    print("\n--- RESULTS ---")
    print(f"TEST 1: {'PASS' if t1 else 'FAIL'}")
    print(f"TEST 2: {'PASS' if t2 else 'FAIL'}")
    print(f"TEST 3: {'PASS' if token else 'FAIL'}")
    print(f"TEST 4: {'PASS' if t4 else 'FAIL'}")

if __name__ == "__main__":
    run_tests()
