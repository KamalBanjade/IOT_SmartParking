# Smart Parking System — Local Setup Guide

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 18 (installed at `C:\Program Files\PostgreSQL\18`) | https://www.postgresql.org/download/ |
| Python | 3.9+ | https://python.org |
| Mosquitto | latest | https://mosquitto.org/download/ |

---

## 1. PostgreSQL

Already installed at `C:\Program Files\PostgreSQL\18\bin\`.

**Add psql to PATH (one-time):**
```powershell
# Run in PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable(
  "PATH",
  $env:PATH + ";C:\Program Files\PostgreSQL\18\bin",
  [System.EnvironmentVariableTarget]::Machine
)
# Then restart terminal
```

**Create the database (already done, for reference):**
```powershell
$env:PGPASSWORD='kamal'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE smart_parking;"
```

---

## 2. Install Mosquitto (MQTT Broker)

1. Download from https://mosquitto.org/download/ → Windows installer
2. Run installer with default settings
3. Start the service:
   ```powershell
   net start mosquitto
   ```
4. Verify it's running:
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto_sub.exe" -t "parking/slots/#" -v
   ```
5. In another terminal, test publish:
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto_pub.exe" -t "parking/slots/ESP32-A1" -m '{"slotId":1,"status":"occupied","controllerId":"ESP32-A1"}'
   ```

---

## 3. Backend Setup

```powershell
cd D:\IOT\backend

# Install dependencies
npm install

# Create tables + seed 5 slots
npm run db:init

# Start dev server (auto-restarts on file change)
npm run dev
```

Server runs at: http://localhost:3000
Health check: http://localhost:3000/health

---

## 4. Python Simulator Setup

```powershell
cd D:\IOT\simulator

# Install paho-mqtt
pip install paho-mqtt

# Run simulator (after Mosquitto is installed)
python simulator.py
```

---

## 5. Frontend Setup

```powershell
cd D:\IOT\frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Running Order

Always start services in this order:

1. **PostgreSQL** — always running as Windows service
2. **Mosquitto** — `net start mosquitto`
3. **Backend** — `npm run dev` (in `D:\IOT\backend`)
4. **Simulator** — `python simulator.py` (in `D:\IOT\simulator`)
5. **Frontend** — `npm run dev` (in `D:\IOT\frontend`)

---

## Troubleshooting

| Error | Fix |
|---|---|
| `database "smart_parking" does not exist` | Run `npm run db:init` after creating the DB |
| `psql: command not found` | Add `C:\Program Files\PostgreSQL\18\bin` to PATH |
| `Connection refused :1883` | Start Mosquitto: `net start mosquitto` |
| `EADDRINUSE :3000` | Another process using port 3000 — kill it or change `PORT` in `.env` |
