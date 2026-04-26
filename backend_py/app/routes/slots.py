from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.services import slot_service
from app.middleware.auth import require_operator, require_admin
from typing import List, Dict, Any

router = APIRouter(prefix="/api/slots", tags=["slots"])

class UpdateSlotModel(BaseModel):
    controllerId: str
    status: str

@router.get("/")
async def get_slots(operator=Depends(require_operator)):
    try:
        slots = await slot_service.get_all_slots()
        return slots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_slot(id: int, operator=Depends(require_operator)):
    try:
        slot = await slot_service.get_slot_by_id(id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        return slot
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
async def update_slot(data: UpdateSlotModel, request: Request, admin=Depends(require_admin)):
    try:
        slot = await slot_service.update_slot_status(data.controllerId, data.status)
        
        # Socket emission
        sio = getattr(request.app.state, "sio", None)
        if sio:
            await sio.emit("slotUpdated", slot)
            
        return slot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
