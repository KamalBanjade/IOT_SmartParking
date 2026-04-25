# Tinkercad Hardware Simulation Guide

## 1. Circuit Diagram Description

To simulate the physical parking slot hardware in Tinkercad:

**Components Needed:**
- Arduino Uno (representing the logic controller)
- HC-SR04 Ultrasonic Distance Sensor
- Jumper Wires

**Wiring:**
- **HC-SR04 VCC** → Arduino **5V**
- **HC-SR04 GND** → Arduino **GND**
- **HC-SR04 TRIG** → Arduino **Digital Pin 9**
- **HC-SR04 ECHO** → Arduino **Digital Pin 10**

---

## 2. Arduino Code (Copy-Paste)

Paste this code into the Tinkercad Code editor (Text mode). Note that this code simulates the *sensor logic* only. Real MQTT communication requires an ESP32 or Ethernet Shield.

```cpp
const int TRIG = 9;
const int ECHO = 10;
const int THRESHOLD = 20; // cm

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  
  Serial.println("--- Smart Parking Hardware Ready ---");
}

void loop() {
  long duration, distance;
  
  // Send Ultrasonic Pulse
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  
  // Read Echo
  duration = pulseIn(ECHO, HIGH);
  
  // Convert to Distance (cm)
  distance = (duration * 0.034) / 2;

  // Determine Occupation Status
  String status = (distance < THRESHOLD) ? "occupied" : "available";

  // Simulation ID (A1)
  Serial.print("SLOT_A1:");
  Serial.print(distance);
  Serial.print("cm -> ");
  Serial.println(status);

  delay(2000); // 2 second read interval
}
```

---

## 3. Transition to Real Hardware

When transitioning from Tinkercad to real ESP32:

1.  Keep the sensor logic (trigger, echo, distance calculation).
2.  Add a WiFi client and MQTT client (PubSubClient library).
3.  Instead of using `Serial.println` to report status, use `mqtt.publish()`.
4.  The JSON payload must match the simulator exactly:
    `{"slotId": 1, "status": "occupied", "controllerId": "ESP32-A1"}`

---

## 4. Observing Results

1.  Start Simulation in Tinkercad.
2.  Click on the HC-SR04 sensor.
3.  Move the "object" (blue circle) closer and further from the sensor.
4.  Open the **Serial Monitor** at the bottom to see status changes in real-time.

---

## 5. Validating Logic Before Flashing

Use this updated Arduino Uno code in Tinkercad to verify the **exact same debounce logic** that runs on the ESP32 before flashing real hardware:

```cpp
// ── Tinkercad Validation Code ──
// Matches esp32_single_slot.ino debounce logic exactly

const int TRIG          = 9;
const int ECHO          = 10;
const int THRESHOLD_CM  = 20;
const int DEBOUNCE_READS = 3;

String currentState  = "unknown";
int debounceCounter  = 0;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.println("--- Smart Parking Tinkercad Validator ---");
}

void loop() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long dur = pulseIn(ECHO, HIGH);
  float dist = dur * 0.034 / 2;
  String newState = (dist < THRESHOLD_CM) ? "occupied" : "available";

  if (newState != currentState) {
    debounceCounter++;
    if (debounceCounter >= DEBOUNCE_READS) {
      currentState = newState;
      debounceCounter = 0;
      // Output format matches backend expectations
      Serial.print("SLOT_STATUS:1:");
      Serial.print(currentState);
      Serial.print(":");
      Serial.println(dist);
    }
  } else {
    debounceCounter = 0;
  }
  delay(500);
}
```

**Expected Serial output:**
```
SLOT_STATUS:1:occupied:12.3
SLOT_STATUS:1:available:45.2
```

The format `SLOT_STATUS:{slotId}:{status}:{distance}` lets you verify the exact same
detection logic that will run on the real ESP32, before any hardware is purchased.

---

## 6. Porting from Tinkercad to ESP32

Follow these steps when hardware is ready:

1. ✅ Verify Serial output matches expected statuses in Tinkercad
2. Open `D:\IOT\hardware\esp32_single_slot\esp32_single_slot.ino` in Arduino IDE
3. Update the 4 config lines at the top of the file:
   ```cpp
   const String WIFI_SSID     = "YourNetworkName";
   const String WIFI_PASSWORD = "YourPassword";
   const String MQTT_BROKER   = "192.168.1.X";  // your server's LAN IP
   const int    SLOT_ID       = 1;               // match DB id
   ```
4. Select board: **Tools → Board → ESP32 Dev Module**
5. Select port: **Tools → Port → COM_X** (whichever appears when ESP32 plugged in)
6. Click **Upload** (→ button)
7. Open **Serial Monitor** at **115200 baud**
8. Watch for:
   ```
   Connecting to WiFi........
   WiFi Connected! IP: 192.168.1.45
   Attempting MQTT connection...connected
   ESP32 [ESP32-A1] ready — Slot [A1]
   ```
9. Cover sensor → verify `[MQTT] A1 -> occupied (12.3cm)` in Serial Monitor
10. Check backend logs → should show `[MQTT] parking/slots/1 occupied`
11. Check Dashboard → Slot A1 should turn red in real-time
