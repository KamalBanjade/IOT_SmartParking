# ➕ Adding a New Parking Slot

This guide walks through adding a new slot (e.g. **C1**) to the system end-to-end.
The architecture is designed so that **one DB row + one ESP32 = fully functional new slot**.

---

## Step 1 — Database

Connect to PostgreSQL and run:

```sql
-- Add the new slot
INSERT INTO parking_slots (label, status, controller_id)
VALUES ('C1', 'available', 'ESP32-C1');

-- Verify
SELECT * FROM parking_slots ORDER BY id;
```

Note the new `id` assigned (e.g. `6`). You'll need it for the next steps.

---

## Step 2 — Simulator Config

Open `D:\IOT\simulator\slots_config.json` and add:

```json
{
  "slotId": 6,
  "label": "C1",
  "controllerId": "ESP32-C1",
  "topic": "parking/slots/6"
}
```

Restart the simulator if it is running.

---

## Step 3 — Hardware (ESP32)

Flash a new ESP32 with `esp32_single_slot.ino`. Change only the top 4 lines:

```cpp
const int    SLOT_ID       = 6;
const String CONTROLLER_ID = "ESP32-C1";
const String SLOT_LABEL    = "C1";
const int    TRIG_PIN      = 5;   // adjust per your wiring
const int    ECHO_PIN      = 18;  // adjust per your wiring
```

Flash, place the ESP32 at the new parking bay, and power it on.

---

## Step 4 — Frontend

**No changes required.** The `ParkingGrid` component fetches all slots from
`GET /api/slots` and renders them automatically.

On the next page load, slot C1 will appear on the dashboard.

---

## Step 5 — Verify

```bash
# 1. Check the API returns the new slot
curl http://localhost:3000/api/slots

# 2. Trigger via simulator (manual mode)
python simulator.py
# Choose: manual → enter slotId=6 → occupied

# 3. Check dashboard — C1 should appear and turn red
```

**Expected flow:**
- Simulator/ESP32 publishes to `parking/slots/6`
- Backend MQTT handler processes the message
- Socket.IO broadcasts `slotUpdated` event
- Dashboard updates C1 in real-time — no restart needed

---

## That's It

The controller_id architecture means:
- **DB** knows which physical controller maps to which slot
- **MQTT** routes updates by slot ID in the topic
- **Frontend** auto-renders any slot returned by the API
- **ESP32** only needs its own `SLOT_ID` and `CONTROLLER_ID` set correctly

No code changes. No restarts. One SQL row + one flashed device = done.
