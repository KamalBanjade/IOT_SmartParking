# 🔌 Smart Parking — Wiring Guide

## 1. Single Slot Wiring (HC-SR04 → ESP32)

```
HC-SR04        ESP32
──────────     ──────────────────────────────
VCC       →   3.3V  (or 5V via VIN pin)
GND       →   GND
TRIG      →   GPIO 5   (direct connection)
ECHO      →   GPIO 18  (⚠ MUST use voltage divider — see below)
```

### ⚠ Voltage Divider (Required for ECHO pin)

The HC-SR04 ECHO output is 5V. The ESP32 GPIO is 3.3V tolerant.
**Without a voltage divider you risk damaging the ESP32.**

```
HC-SR04 ECHO ──── 1kΩ ──── GPIO 18 (ESP32)
                       │
                      2kΩ
                       │
                      GND
```

This divides 5V → 3.3V: `5V × (2kΩ / (1kΩ + 2kΩ)) = 3.33V ✓`

---

## 2. Multi-Slot Wiring Table

| Slot | Label | TRIG Pin | ECHO Pin | Voltage Divider? |
|------|-------|----------|----------|-----------------|
| 1    | A1    | GPIO 5   | GPIO 18  | ✅ Required      |
| 2    | A2    | GPIO 19  | GPIO 21  | ✅ Required      |
| 3    | B1    | GPIO 22  | GPIO 23  | ✅ Required      |

> **Important**: Leave at least 50ms between sensor reads to prevent one sensor's ultrasonic pulse
> from being picked up by another sensor's ECHO pin (crosstalk).
> The `SENSOR_STAGGER` constant in firmware handles this automatically.

---

## 3. Power Options

| Option | Connection | Best For |
|--------|-----------|----------|
| USB Power Bank | USB-C port | Temporary / testing |
| 5V DC Adapter | 5V → VIN pin | Permanent install |
| PoE + Buck Converter | 48V → 5V via buck → VIN | Professional multi-slot install |

> The ESP32 itself draws ~200mA during WiFi activity. Each HC-SR04 draws ~15mA.
> For 3 sensors: plan for a 500mA minimum power supply.

---

## 4. Enclosure & Mounting Notes

```
Ceiling / Beam
│
│  ← 200-250 cm above ground
│
[HC-SR04 Sensor]  ← Faces straight DOWN (0° tilt)
│
│
─────────────────  ← Ground / car roof
```

- **Mount height**: 200–250 cm above the ground (accounts for car roof ~150 cm)
- **Angle**: Perfectly vertical. Even a 10° tilt causes inaccurate readings.
- **Clearance**: Keep sensor at least 50 cm from walls and other sensors.
- **Enclosure**: Use a weatherproof ABS box. Drill 2 holes for the sensor's eyes.
- **Cable**: Use shielded cable for ECHO if wire run is > 30 cm.

---

## 5. Required Libraries (Arduino IDE Library Manager)

Search for and install each:

| Library | Author | Purpose |
|---------|--------|---------|
| `PubSubClient` | Nick O'Leary | MQTT client |
| `ArduinoJson` | Benoit Blanchon | JSON build/parse |
| `WiFi` | Built-in ESP32 | WiFi connectivity |

**Arduino IDE Board Setup:**
1. File → Preferences → Additional Boards Manager URLs:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2. Tools → Board → Boards Manager → search "esp32" → Install
3. Tools → Board → ESP32 Arduino → **ESP32 Dev Module**
4. Tools → Upload Speed → **115200**

---

## 6. Full Pin Reference (ESP32 Dev Module)

```
        ┌────────────────────┐
    EN  │ EN            D23  │ ← Slot 3 ECHO
    VP  │ VP            D22  │ ← Slot 3 TRIG
    VN  │ VN            TX0  │
    D34 │ D34           RX0  │
    D35 │ D35           D21  │ ← Slot 2 ECHO
    D32 │ D32            D19 │ ← Slot 2 TRIG
    D33 │ D33            D18 │ ← Slot 1 ECHO
    D25 │ D25            D5  │ ← Slot 1 TRIG
    D26 │ D26            D17 │
    D27 │ D27            D16 │
    D14 │ D14             D4 │
    D12 │ D12             D2 │ ← Built-in LED (status)
    GND │ GND            D15 │
    D13 │ D13            GND │
    D9  │ D9              D8 │
    D10 │ D10             D7 │
    D11 │ D11             D6 │
    VIN │ VIN  [5V IN]       │
        └────────────────────┘
```
