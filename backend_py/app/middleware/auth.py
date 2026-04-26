from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import verify_token
from typing import Optional

security = HTTPBearer(auto_error=False)

async def require_operator(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication required"
        )
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") != "operator":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    payload = await require_operator(credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload

async def require_customer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication required"
        )
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") != "customer":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

# Optional authentication dependency
async def optional_operator(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") == "operator":
            return payload
        return None
    except Exception:
        return None

async def optional_customer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") == "customer":
            return payload
        return None
    except Exception:
        return None

async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    if not credentials:
        return None
    try:
        return verify_token(credentials.credentials)
    except Exception:
        return None
