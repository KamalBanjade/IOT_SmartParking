import aiomqtt
import asyncio
import json
from app.services import slot_service, session_service, payment_service
from app.config.settings import settings

async def mqtt_loop(sio):
    while True:
        try:
            async with aiomqtt.Client(settings.MQTT_BROKER, settings.MQTT_PORT) as client:
                print(f"[MQTT] Connected to broker: {settings.MQTT_BROKER}")
                await client.subscribe(settings.MQTT_TOPIC_SLOTS)
                print(f"[MQTT] Subscribed to: {settings.MQTT_TOPIC_SLOTS}")
                
                async for message in client.messages:
                    await handle_message(str(message.topic), message.payload.decode(), sio)
        except Exception as e:
            print(f"[MQTT] Connection lost: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)

async def handle_message(topic, payload, sio):
    try:
        data = json.loads(payload)
        status = data.get("status")
        controller_id = data.get("controllerId")

        print(f"[MQTT] Message on {topic}: {data}")

        if status not in ["occupied", "available"]:
            print(f"[MQTT] Invalid status: {status}")
            return

        slot = await slot_service.update_slot_status(controller_id, status)

        if status == "occupied":
            await session_service.start_session(slot["id"])
        else:
            session = await session_service.end_session(slot["id"])
            if session:
                await payment_service.create_payment(
                    session["id"], session["amountDue"]
                )

        await sio.emit("slotUpdated", {
            "slotId": slot["id"],
            "label": slot["label"],
            "status": status,
            "last_updated": slot["last_updated"].isoformat() if slot.get("last_updated") else None
        })

        print(f"[MQTT] Sync: {slot['label']} is now {status}")

    except Exception as e:
        print(f"[MQTT] Handler error: {e}")
