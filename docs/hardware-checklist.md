# 🛠️ Smart Parking — Hardware Integration Checklist

This document outlines the steps required to transition from the software simulator to real ESP32 hardware.

---

## 1. ESP32 Hardware Configuration

Each ESP32 must be flashed with the following configuration:

### Network Settings
- **WiFi SSID**: Your local network name
- **WiFi Password**: Your local network password
- **MQTT Broker IP**: The local IP address of the machine running the backend (e.g., `192.168.1.5`). *Do not use `localhost` or `127.0.0.1`.*

### Device Identity
Each device needs a unique `controller_id`:
```cpp
#define CONTROLLER_ID "ESP32-A1" // Change per slot
```

### MQTT Topic & Payload
- **Topic**: `parking/slots/update`
- **Payload Format**:
```json
{
  "controllerId": "ESP32-A1",
  "status": "occupied" // or "available"
}
```

---

## 2. Mosquitto Broker Setup

For production hardware to connect, the Mosquitto broker must be configured to allow external connections.

1. **Locate `mosquitto.conf`**: Usually in `C:\Program Files\mosquitto\mosquitto.conf`.
2. **Edit Configuration**:
   ```conf
   listener 1883
   allow_anonymous true
   ```
3. **Restart Service**: `net stop mosquitto` followed by `net start mosquitto`.
4. **Firewall**: Ensure port `1883` is open in Windows Firewall.

---

## 3. Slot Mapping Table

| Slot Label | Controller ID | Hardware Pin (Trigger) |
|------------|---------------|------------------------|
| A1         | ESP32-A1      | GPIO 4                 |
| A2         | ESP32-A2      | GPIO 5                 |
| B1         | ESP32-B1      | GPIO 18                |
| B2         | ESP32-B2      | GPIO 19                |
| B3         | ESP32-B3      | GPIO 21                |

---

## 4. Go-Live Steps

1. **Deploy Backend**: Run `npm run dev` on the host machine.
2. **Flash Hardware**: Use Arduino IDE or PlatformIO to upload firmware to all ESP32s.
3. **Serial Monitor Check**: Verify that each ESP32 connects to WiFi and the MQTT broker.
4. **Manual Trigger Test**:
   - Place an object in front of the IR sensor (Slot A1).
   - Check the **Dashboard** — the slot should turn red instantly.
   - Remove the object.
   - Check the **Dashboard** — the slot should turn green.
5. **Verify DB**: Check `parking_sessions` table to ensure entries are created correctly.

---

## 5. Troubleshooting
- **No connection?** Check if the ESP32 and Server are on the same WiFi network.
- **Messages not arriving?** Use `mosquitto_sub -h localhost -t "#" -v` to monitor all traffic.
- **Wrong slot updates?** Verify `controller_id` matches exactly between hardware and `parking_slots` table.
