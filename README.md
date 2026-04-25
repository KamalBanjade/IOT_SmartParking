# 🚗 Smart Parking System

A full-stack IoT parking management system with real-time slot monitoring, member loyalty program, digital payments via Khalti, and ESP32 hardware integration.

Built for a final-year engineering project. Production-ready: runs on a local server, displays on any browser, and handles real hardware or a software simulator.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART PARKING SYSTEM                         │
│                                                                 │
│  ┌──────────────┐  MQTT  ┌───────────────────────────────────┐ │
│  │ ESP32 + Sensor│──────▶│                                   │ │
│  └──────────────┘        │     Node.js Backend (Express)     │ │
│                          │                                   │ │
│  ┌──────────────┐  MQTT  │  ┌─────────┐  ┌──────────────┐  │ │
│  │  Simulator   │──────▶│  │ MQTT Hd │  │ REST API      │  │ │
│  │  (Python)    │        │  └────┬────┘  └──────┬───────┘  │ │
│  └──────────────┘        │       │               │           │ │
│                          │  ┌────▼───────────────▼───────┐  │ │
│  ┌──────────────┐        │  │   PostgreSQL Database      │  │ │
│  │   Khalti     │◀──────▶│  └───────────────────────────┘  │ │
│  │   Gateway    │        │                                   │ │
│  └──────────────┘        │  Socket.IO ──▶ React Frontend    │ │
│                          └───────────────────────────────────┘ │
│                                         ▲                       │
│                          Browser / Tablet / Operator Screen     │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow**: ESP32 detects car → publishes MQTT → backend processes → updates DB → Socket.IO event → dashboard updates in <100ms.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Hardware | ESP32 + HC-SR04 | Occupancy detection |
| IoT Protocol | MQTT (Mosquitto) | Real-time sensor data |
| Backend | Node.js + Express | REST API + Socket.IO |
| Database | PostgreSQL | Persistent storage |
| Real-time | Socket.IO | Live dashboard updates |
| Frontend | React + Vite + Tailwind v4 | Operator dashboard |
| Payment | Khalti API | Digital payments (NPR) |
| Simulator | Python + paho-mqtt | Hardware-free testing |
| Process Mgr | PM2 | Production process management |

---

## Prerequisites

| Software | Version | Download |
|----------|---------|---------|
| Node.js | v18+ | nodejs.org |
| Python | 3.10+ | python.org |
| PostgreSQL | 14+ | postgresql.org |
| Mosquitto MQTT | Latest | mosquitto.org |
| Arduino IDE | 2.x | arduino.cc (for ESP32) |

---

## Quick Start (Development)

```bash
# 1. Clone / copy project to D:\IOT

# 2. Create database
# Open pgAdmin or psql:
CREATE DATABASE smart_parking;

# 3. Configure backend
cd D:\IOT\backend
cp .env.example .env
# Edit .env — set DB_PASSWORD to your postgres password

# 4. Initialize database schema
node config/initDb.js

# 5. Install backend dependencies
npm install

# 6. Install frontend dependencies
cd D:\IOT\frontend
npm install

# 7. Install simulator dependencies
cd D:\IOT\simulator
pip install -r requirements.txt
```

Then run each in a separate terminal:

```bash
# Terminal 1 — MQTT Broker
net start mosquitto

# Terminal 2 — Backend
cd D:\IOT\backend
npm run dev

# Terminal 3 — Simulator (optional — replaces hardware)
cd D:\IOT\simulator
python simulator.py auto

# Terminal 4 — Frontend
cd D:\IOT\frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Folder Structure

```
D:\IOT\
│
├── backend\                        # Node.js Express API
│   ├── config\
│   │   ├── db.js                   # PostgreSQL pool singleton
│   │   ├── initDb.js               # Run schema + seed data
│   │   └── migrateKhalti.js        # Add Khalti columns to payments
│   ├── middleware\
│   │   ├── errorHandler.js         # Global error handler
│   │   ├── rateLimiter.js          # express-rate-limit middleware
│   │   └── validator.js            # Input validation middleware
│   ├── mqtt\
│   │   └── mqttHandler.js          # MQTT subscription + event pipeline
│   ├── routes\
│   │   ├── admin.js                # Dashboard stats + analytics endpoints
│   │   ├── payments.js             # Payment flow + Khalti initiate/verify
│   │   ├── sessions.js             # Session entry/exit lifecycle
│   │   ├── slots.js                # Slot CRUD + status update
│   │   └── users.js                # Member register/scan/points/discount
│   ├── services\
│   │   ├── khaltiService.js        # Khalti API initiate + lookup
│   │   ├── paymentService.js       # Payment logic + loyalty point award
│   │   ├── sessionService.js       # Session lifecycle + stale cleanup
│   │   ├── slotService.js          # Slot queries + status update
│   │   └── userService.js          # User CRUD + QR + loyalty points
│   ├── socket\
│   │   └── socketHandler.js        # Socket.IO init + initialState emit
│   ├── logs\                       # PM2 log output (auto-created)
│   ├── .env                        # Development environment variables
│   ├── .env.production             # Production environment template
│   ├── ecosystem.config.cjs        # PM2 process configuration
│   ├── server.js                   # Express app entry point
│   └── testPhase6.js               # Verification test script
│
├── frontend\                       # React + Vite + Tailwind v4
│   ├── src\
│   │   ├── components\
│   │   │   ├── payment\
│   │   │   │   └── PaymentModal.jsx    # Exit + payment flow modal
│   │   │   ├── shared\
│   │   │   │   └── Navbar.jsx          # Top navigation bar
│   │   │   └── user\
│   │   │       ├── QRScanner.jsx       # Camera + manual QR scan
│   │   │       └── UserCard.jsx        # Scanned member display
│   │   ├── context\
│   │   │   └── ParkingContext.jsx      # Global state (slots, modals)
│   │   ├── pages\
│   │   │   ├── AdminPage.jsx           # Stats + session table
│   │   │   ├── AnalyticsPage.jsx       # Pure-SVG analytics charts
│   │   │   ├── DashboardPage.jsx       # Main operator dashboard
│   │   │   ├── DisplayPage.jsx         # Public-facing TV display
│   │   │   ├── MemberPage.jsx          # Member profile + history
│   │   │   ├── PaymentFailurePage.jsx  # Khalti cancel/failure
│   │   │   ├── PaymentSuccessPage.jsx  # Khalti return + verify
│   │   │   └── RegisterPage.jsx        # New member registration
│   │   ├── services\
│   │   │   └── api.js                  # Axios API client methods
│   │   ├── App.jsx                     # Router + routes
│   │   └── index.css                   # Tailwind v4 theme + base styles
│   ├── .env.production                 # Production frontend env
│   └── index.html                      # HTML entry point
│
├── simulator\                      # Python MQTT simulator
│   ├── simulator.py                # Main simulator (auto/manual/scenario)
│   ├── mqtt_client.py              # MQTT connection + publish helpers
│   ├── sensor_logger.py            # Ultrasonic noise simulation
│   ├── slots_config.json           # Slot → topic mapping
│   ├── requirements.txt            # paho-mqtt, colorama, python-dotenv
│   └── .env                        # Simulator MQTT config
│
├── hardware\                       # ESP32 firmware
│   ├── esp32_single_slot\
│   │   └── esp32_single_slot.ino   # Single slot firmware (flash-ready)
│   ├── esp32_multi_slot\
│   │   └── esp32_multi_slot.ino    # Multi-sensor firmware (1 ESP32, 3 slots)
│   ├── wiring_guide.md             # HC-SR04 wiring + voltage divider
│   └── tinkercad_notes.md          # Simulation + porting guide
│
├── docs\                           # Documentation
│   ├── schema.sql                  # PostgreSQL schema + seed data
│   ├── architecture.md             # System design + ASCII diagram
│   ├── setup.md                    # First-run setup instructions
│   ├── hardware-checklist.md       # Pre-deployment hardware checklist
│   ├── mosquitto_production.conf   # Mosquitto broker config for production
│   ├── add_new_slot.md             # Guide to adding a new slot
│   └── troubleshooting.md          # 7 common issues + fixes
│
├── start_system.bat                # One-click system startup
├── stop_system.bat                 # One-click system shutdown
└── README.md                       # This file
```

---

## Configuration

### Backend `.env` Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend HTTP port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `smart_parking` | Database name |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | `yourpass` | DB password |
| `MQTT_BROKER` | `mqtt://localhost:1883` | Mosquitto broker URL |
| `PARKING_RATE_PER_HOUR` | `30` | NPR per hour charge |
| `KHALTI_SECRET_KEY` | `8f3e...` | Khalti merchant secret key |
| `KHALTI_BASE_URL` | `https://khalti.com/api/v2/epayment/` | Khalti API base URL |
| `FRONTEND_URL` | `http://localhost:5173` | Used for Khalti return URL |

---

## Running in Production

```bash
# 1. Build frontend
cd D:\IOT\frontend
npm run build

# 2. Install PM2 globally (once)
npm install -g pm2
npm install -g serve

# 3. Start everything
D:\IOT\start_system.bat
```

Or manually with PM2:
```bash
cd D:\IOT\backend
pm2 start ecosystem.config.cjs --env production

cd D:\IOT\frontend
pm2 serve dist 5173 --name smart-parking-ui --spa
```

---

## Hardware Setup

See [`hardware/wiring_guide.md`](hardware/wiring_guide.md) for wiring diagrams.  
See [`docs/hardware-checklist.md`](docs/hardware-checklist.md) for the full go-live checklist.

**Quick start** — edit just 4 lines in `esp32_single_slot.ino`:
```cpp
const int    SLOT_ID       = 1;
const String CONTROLLER_ID = "ESP32-A1";
const char*  WIFI_SSID     = "YourNetwork";
const char*  MQTT_BROKER   = "192.168.1.100";  // server's LAN IP
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/slots` | Get all parking slots |
| POST | `/api/slots/update` | Manual slot status update |
| POST | `/api/users/register` | Register new member |
| POST | `/api/users/scan` | Scan QR token → get member info |
| GET | `/api/users/search?q=` | Search members by name/phone |
| GET | `/api/users/:id` | Get member profile |
| GET | `/api/users/:id/points-summary` | Get loyalty points summary |
| POST | `/api/users/:id/apply-discount` | Redeem 50 points for NPR 25 off |
| POST | `/api/sessions/entry` | Start/link a session |
| POST | `/api/sessions/exit` | End session + create payment |
| GET | `/api/sessions/active` | Get all active sessions |
| GET | `/api/payments/:sessionId` | Get payment for a session |
| POST | `/api/payments/:id/pay` | Mark payment as paid (cash) |
| POST | `/api/payments/:id/khalti/initiate` | Start Khalti checkout |
| POST | `/api/payments/khalti/verify` | Verify Khalti return |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/analytics/revenue` | Revenue trend data |
| GET | `/api/admin/analytics/peak-hours` | Hourly occupancy data |
| GET | `/api/admin/analytics/slot-performance` | Per-slot utilization |
| GET | `/api/admin/analytics/members` | Member behavior stats |

---

## MQTT Reference

| Topic | Publisher | Payload |
|-------|-----------|---------|
| `parking/slots/{slotId}` | ESP32 / Simulator | `{"slotId":1,"status":"occupied","controllerId":"ESP32-A1","distance":12.3}` |
| `parking/status/{controllerId}` | ESP32 | `{"online":true,"controllerId":"ESP32-A1","slotLabel":"A1"}` |
| `parking/commands/{controllerId}` | Backend (future) | Reserved for remote commands |

---

## Simulator Usage

```bash
cd D:\IOT\simulator
python simulator.py
```

| Mode | Description |
|------|-------------|
| `auto` | Randomly occupies/frees slots every 5-15s |
| `manual` | You choose slot + status interactively |
| `scenario` | Runs pre-scripted scenarios |

**Scenarios**: `morning_rush`, `evening_exit`, `full_lot`, `weekend_slow`

---

## Khalti Payment Flow

```
[Operator clicks "Pay with Khalti"]
         │
         ▼
POST /api/payments/:id/khalti/initiate
  → Calls Khalti API: POST /epayment/initiate/
  → Returns: { payment_url, pidx }
  → Saves pidx to DB
         │
         ▼
[Frontend stores paymentId in localStorage]
[Redirects browser to payment_url]
         │
         ▼
[User completes payment on Khalti]
         │
         ▼
[Khalti redirects to /payment/success?pidx=...]
         │
         ▼
POST /api/payments/khalti/verify
  → Calls Khalti API: POST /epayment/lookup/
  → Checks status === "Completed"
  → Marks payment paid in DB
  → Awards loyalty points
         │
         ▼
[Success page shows: amount, transaction ID, points earned]
```

---

## Troubleshooting

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for 7 common issues with step-by-step fixes.

---

## Adding a New Slot

See [`docs/add_new_slot.md`](docs/add_new_slot.md) — it takes 2 minutes:
1. One `INSERT` in the database
2. Flash one ESP32 with updated `SLOT_ID`
3. No code changes, no restart needed
