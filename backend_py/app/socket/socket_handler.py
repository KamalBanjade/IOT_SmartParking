import socketio
from app.services import slot_service

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*"
)

def serialize_slots(slots):
    """Convert any datetime fields to ISO string for JSON serialization."""
    result = []
    for slot in slots:
        s = dict(slot)
        if "last_updated" in s and hasattr(s["last_updated"], "isoformat"):
            s["last_updated"] = s["last_updated"].isoformat()
        result.append(s)
    return result

@sio.event
async def connect(sid, environ, auth=None):  # Fix 1: add auth=None
    print(f"[SOCKET] Client connected: {sid}")
    slots = await slot_service.get_all_slots()
    safe_slots = serialize_slots(slots)  # Fix 2: serialize datetimes
    await sio.emit("initialState", safe_slots, to=sid)

@sio.event
async def disconnect(sid):
    print(f"[SOCKET] Client disconnected: {sid}")