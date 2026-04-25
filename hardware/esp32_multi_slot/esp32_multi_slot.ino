/*
 * 🚗 Smart Parking System — ESP32 Multi-Slot Firmware
 * Controls up to 3 HC-SR04 sensors from one ESP32
 *
 * Required Libraries:
 * - PubSubClient by Nick O'Leary
 * - ArduinoJson by Benoit Blanchon
 * - WiFi (built-in)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─── Slot Configuration Struct ──────────────────────────────
struct SlotConfig {
  int    slotId;
  String controllerId;
  String label;
  int    trigPin;
  int    echoPin;
  int    thresholdCm;
};

// ═══════════════════════════════
// CONFIGURE THIS UNIT
// ═══════════════════════════════
const int NUM_SLOTS = 2;

SlotConfig slots[NUM_SLOTS] = {
  { 1, "ESP32-A1", "A1", 5,  18, 20 },
  { 2, "ESP32-A2", "A2", 19, 21, 20 }
};

// Network (same for all units)
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "YOUR_SERVER_IP";
const int   MQTT_PORT     = 1883;
// ═══════════════════════════════

const int   DEBOUNCE_READS  = 3;
const int   READ_INTERVAL   = 500;   // ms between full scan cycles
const int   SENSOR_STAGGER  = 50;    // ms between sensors (avoids interference)
const int   STATUS_LED      = 2;

WiFiClient espClient;
PubSubClient client(espClient);

String slotState[3]     = {"unknown","unknown","unknown"};
int    debounce[3]      = {0, 0, 0};
float  lastDist[3]      = {0, 0, 0};
unsigned long lastScan  = 0;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(slots[i].trigPin, OUTPUT);
    pinMode(slots[i].echoPin, INPUT);
  }
  pinMode(STATUS_LED, OUTPUT);
  connectWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(onMQTTMessage);
  Serial.println("ESP32 Multi-Slot ready — " + String(NUM_SLOTS) + " slots");
}

void loop() {
  if (!client.connected()) connectMQTT();
  client.loop();

  if (millis() - lastScan >= READ_INTERVAL) {
    lastScan = millis();
    for (int i = 0; i < NUM_SLOTS; i++) {
      float d = readDistance(slots[i].trigPin, slots[i].echoPin);
      if (d > 0) {
        lastDist[i] = d;
        detectStateChange(i, d);
      }
      delay(SENSOR_STAGGER);
    }
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 30000) {
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    delay(100);
    Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) { Serial.println("\nFailed. Restarting."); ESP.restart(); }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
}

void connectMQTT() {
  while (!client.connected()) {
    String clientId = "ESP32-MULTI-" + String(random(0xffff), HEX);
    Serial.print("MQTT connecting...");

    // LWT uses first slot's controller ID as unit ID
    String unitId = slots[0].controllerId;
    StaticJsonDocument<128> lwt;
    lwt["online"] = false; lwt["controllerId"] = unitId;
    char lwtBuf[128]; serializeJson(lwt, lwtBuf);
    String statusTopic = "parking/status/" + unitId;

    if (client.connect(clientId.c_str(), statusTopic.c_str(), 1, true, lwtBuf)) {
      Serial.println("connected");
      // Announce each slot online
      for (int i = 0; i < NUM_SLOTS; i++) {
        StaticJsonDocument<128> doc;
        doc["online"] = true;
        doc["controllerId"] = slots[i].controllerId;
        doc["slotLabel"] = slots[i].label;
        char buf[128]; serializeJson(doc, buf);
        String t = "parking/status/" + slots[i].controllerId;
        client.publish(t.c_str(), buf, true);
        // Subscribe commands
        String ct = "parking/commands/" + slots[i].controllerId;
        client.subscribe(ct.c_str());
      }
    } else {
      Serial.println("failed rc=" + String(client.state()) + " retry in 5s");
      delay(5000);
    }
  }
}

float readDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long dur = pulseIn(echoPin, HIGH, 30000);
  if (dur == 0) return -1;
  return dur * 0.034 / 2;
}

void detectStateChange(int idx, float distance) {
  String newState = (distance < slots[idx].thresholdCm) ? "occupied" : "available";
  if (newState != slotState[idx]) {
    debounce[idx]++;
    if (debounce[idx] >= DEBOUNCE_READS) {
      slotState[idx] = newState;
      debounce[idx] = 0;
      publishStatus(idx, newState);
    }
  } else {
    debounce[idx] = 0;
  }
}

void publishStatus(int idx, String status) {
  StaticJsonDocument<256> doc;
  doc["slotId"]       = slots[idx].slotId;
  doc["status"]       = status;
  doc["controllerId"] = slots[idx].controllerId;
  doc["distance"]     = lastDist[idx];
  doc["timestamp"]    = millis();
  char buf[256]; serializeJson(doc, buf);
  String topic = "parking/slots/" + String(slots[idx].slotId);
  client.publish(topic.c_str(), buf, true);
  Serial.println("[MQTT] " + slots[idx].label + " -> " + status + " (" + String(lastDist[idx]) + "cm)");
}

void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("[CMD] "); Serial.print(topic); Serial.print(": ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();
}
