import asyncio
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.config.db import connect_db, disconnect_db
from app.config.settings import settings
from app.socket.socket_handler import sio
from app.mqtt.mqtt_handler import mqtt_loop
from app.services.session_service import abandon_stale_sessions
from app.middleware.rate_limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# Import all routers
from app.routes import slots, users, sessions, payments, admin, auth, esewa

mqtt_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global mqtt_task
    # Startup
    await connect_db()
    abandoned = await abandon_stale_sessions()
    print(f"Stale session cleanup: {abandoned} abandoned")
    
    # Start MQTT in background
    mqtt_task = asyncio.create_task(mqtt_loop(sio))
    print("MQTT listener started")
    print(f"Smart Parking API running on port {settings.PORT}")
    
    yield
    
    # Shutdown
    if mqtt_task:
        mqtt_task.cancel()
    await disconnect_db()

app = FastAPI(
    title="Smart Parking API",
    version="1.0.0",
    lifespan=lifespan
)

app.state.sio = sio

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    from datetime import datetime
    return {
        "status": "ok",
        "service": "Smart Parking API",
        "timestamp": datetime.utcnow().isoformat()
    }

# Mount routers
app.include_router(slots.router)
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(esewa.router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
