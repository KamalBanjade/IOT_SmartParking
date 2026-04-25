# Smart Parking System — Architecture

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ESP32 + HC-SR04 │  │ Python Simulator│  │  Postman/CURL   │  │
│  │ (Tinkercad now, │  │ (Dev/Testing)   │  │  (Manual tests) │  │
│  │  real HW later) │  │                 │  │                 │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────── ┼ ──────────────────── ┼ ─────────┘
            │  MQTT publish       │  MQTT publish        │ REST POST
            ▼                    ▼                        │
   ┌─────────────────────────────────┐                    │
   │      Mosquitto Broker :1883     │                    │
   │   Topic: parking/slots/#        │                    │
   └──────────────┬──────────────────┘                    │
                  │ mqtt.js subscribe                      │
                  ▼                                        ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                  Node.js / Express  :3000                    │
   │                                                              │
   │  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐   │
   │  │ slotService │  │sessionService │  │  paymentService  │   │
   │  │             │  │               │  │ (eSewa/Khalti    │   │
   │  │ Resolves    │  │ start/end     │  │  stubs)          │   │
   │  │ controller_ │  │ session,      │  │                  │   │
   │  │ id → slot   │  │ calc duration │  │                  │   │
   │  └──────┬──────┘  └───────┬───────┘  └────────┬─────────┘   │
   │         └─────────────────┼──────────────────── ┘            │
   │                           │ raw pg queries                    │
   │                           ▼                                   │
   │              ┌─────────────────────┐                          │
   │              │  PostgreSQL :5432   │                          │
   │              │  DB: smart_parking  │                          │
   │              └─────────────────────┘                          │
   │                                                              │
   │  Socket.IO server ──────────────────────────────────────►   │
   └──────────────────────────────────────────────────────────────┘
                  │ Socket.IO  ws://
                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │              React Frontend  :5173                           │
   │                                                              │
   │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
   │  │ ParkingGrid  │  │  SessionPanel │  │  Admin Dashboard │  │
   │  │ (live slots) │  │  (active      │  │  (payments, QR,  │  │
   │  │              │  │   sessions)   │  │   reports)       │  │
   │  └──────────────┘  └───────────────┘  └──────────────────┘  │
   └──────────────────────────────────────────────────────────────┘
```

---

## 2. MQTT Topic Structure

| Topic | Direction | Publisher | Payload |
|---|---|---|---|
| `parking/slots/{controllerId}` | ESP32 → Broker → Backend | ESP32 / Simulator | `{"slotId":1,"status":"occupied","controllerId":"ESP32-A1"}` |
| `parking/slots/#` | Backend subscribes | — | wildcard catch-all |

**Payload format is fixed and never changes:**
```json
{
  "slotId": 1,
  "status": "occupied",
  "controllerId": "ESP32-A1"
}
```

**Controller ID naming convention:**  
`ESP32-{Zone}{SlotNumber}` → `ESP32-A1`, `ESP32-B3`

---

## 3. Database Table Relationships

```
parking_slots (id, label, status, controller_id, last_updated)
      │
      │ slot_id
      ▼
parking_sessions (id, slot_id, user_id, entry_time, exit_time, duration_minutes, status)
      │                │
      │ session_id     │ user_id
      ▼                ▼
payments           users (id, name, phone, is_member, qr_token)
(id, session_id,        │
 amount, method,        │ user_id + session_id
 status, paid_at)       ▼
                   loyalty_points (user_id, session_id, points)
```

**Key constraint:** `parking_slots.controller_id` is UNIQUE — each ESP32 maps to exactly one slot.

---

## 4. Slot Status State Machine

```
      [free / available]
           │  ▲
  occupied │  │ free (sensor clears)
           ▼  │
       [occupied]
           │
   exit + payment
           ▼
     Session closed → Payment record created
```

---

## 5. Planned REST API

### Slots
```
GET    /api/slots              → list all slots + current status
GET    /api/slots/:id          → single slot detail
PATCH  /api/slots/:id/status   → manual admin override
```

### Sessions
```
GET    /api/sessions                   → all sessions (paginated)
GET    /api/sessions/active            → currently active sessions
GET    /api/sessions/:id               → session detail
POST   /api/sessions/:id/end           → manually end a session (admin)
```

### Payments
```
POST   /api/payments                   → create payment record
GET    /api/payments/:sessionId        → payment for a session
POST   /api/payments/esewa/initiate    → initiate eSewa payment (stub)
POST   /api/payments/khalti/initiate   → initiate Khalti payment (stub)
POST   /api/payments/esewa/verify      → verify eSewa callback
POST   /api/payments/khalti/verify     → verify Khalti callback
```

### Users & Membership
```
POST   /api/users                → create / register user
GET    /api/users/:id            → get user profile
PATCH  /api/users/:id/membership → toggle membership
GET    /api/users/:token/qr      → generate QR code image (base64)
POST   /api/users/scan           → validate QR scan at entry
```

### Admin
```
GET    /api/admin/stats          → total slots, occupied, revenue today
GET    /api/admin/reports        → session + revenue report (date range)
PATCH  /api/admin/rate           → update parking rate per hour
```

---

## 6. Real-time Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `slot:update` | Server → Client | `{ slotId, label, status, controllerId, lastUpdated }` |
| `session:started` | Server → Client | `{ sessionId, slotId, entryTime }` |
| `session:ended` | Server → Client | `{ sessionId, slotId, duration, amount }` |
| `payment:completed` | Server → Client | `{ sessionId, amount, method }` |

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Microcontroller | ESP32 (Tinkercad → real hardware) |
| Sensor | HC-SR04 Ultrasonic |
| IoT Protocol | MQTT (paho / PubSubClient) |
| Broker | Mosquitto :1883 |
| Backend | Node.js + Express (ES modules) |
| Database | PostgreSQL :5432 |
| DB Driver | pg (raw SQL, no ORM) |
| Real-time | Socket.IO |
| Frontend | React + Vite |
| Simulation | Python + paho-mqtt |
| Payments | eSewa / Khalti (Nepal) |
| Currency | NPR |

---

## 8. Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.9+
- Mosquitto MQTT Broker

### Install Mosquitto (Windows)
1. Download from https://mosquitto.org/download/
2. Install with default settings
3. Start: `net start mosquitto`
4. Test: `mosquitto_sub -t parking/slots/#`

### Backend Setup
```bash
cd D:\IOT\backend
npm install
# Edit .env with your DB password
npm run db:init      # creates all tables + seed data
npm run dev          # starts server with nodemon
```

### Simulator Setup
```bash
cd D:\IOT\simulator
pip install paho-mqtt
python simulator.py
```

### Frontend Setup
```bash
cd D:\IOT\frontend
npm install
npm run dev
```
