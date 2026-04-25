/*
 * 🚗 Smart Parking System — ESP32 Single Slot Firmware
 * 
 * Required Libraries:
 * - PubSubClient by Nick O'Leary
 * - ArduinoJson by Benoit Blanchon
 * - WiFi (built-in)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ═══════════════════════════════
// CONFIGURE THIS UNIT
// ═══════════════════════════════
const int    SLOT_ID        = 1;
const String CONTROLLER_ID  = "ESP32-A1";
const String SLOT_LABEL     = "A1";
const int    TRIG_PIN       = 5;
const int    ECHO_PIN       = 18;
const int    STATUS_LED     = 2; // Built-in LED
// ═══════════════════════════════

// Network (same for all units)
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER     = "YOUR_SERVER_IP";
const int   MQTT_PORT       = 1883;

// Detection
const int   THRESHOLD_CM    = 20;
const int   DEBOUNCE_READS  = 3;    // consecutive reads before state change
const int   READ_INTERVAL   = 500;  // ms between reads

// Global State
WiFiClient espClient;
PubSubClient client(espClient);
String currentState = "unknown";
int debounceCounter = 0;
float lastDistance = 0;
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  connectWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(onMQTTMessage);
  
  Serial.println("\nESP32 [" + CONTROLLER_ID + "] ready — Slot [" + SLOT_LABEL + "]");
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    
    float distance = readDistance();
    if (distance > 0) {
      lastDistance = distance;
      detectStateChange(distance);
    }
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 30000) {
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Fast blink
    delay(100);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi Failed. Restarting...");
    ESP.restart();
  }

  digitalWrite(STATUS_LED, LOW);
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void connectMQTT() {
  while (!client.connected()) {
    String clientId = "ESP32-" + CONTROLLER_ID + "-" + String(random(0xffff), HEX);
    Serial.print("Attempting MQTT connection as " + clientId + "...");
    
    // Will message (LWT)
    StaticJsonDocument<128> lwtDoc;
    lwtDoc["online"] = false;
    lwtDoc["controllerId"] = CONTROLLER_ID;
    char lwtPayload[128];
    serializeJson(lwtDoc, lwtPayload);
    
    String statusTopic = "parking/status/" + CONTROLLER_ID;

    if (client.connect(clientId.c_str(), statusTopic.c_str(), 1, true, lwtPayload)) {
      Serial.println("connected");
      
      // Publish online status
      StaticJsonDocument<128> onlineDoc;
      onlineDoc["online"] = true;
      onlineDoc["controllerId"] = CONTROLLER_ID;
      onlineDoc["slotLabel"] = SLOT_LABEL;
      char onlinePayload[128];
      serializeJson(onlineDoc, onlinePayload);
      client.publish(statusTopic.c_str(), onlinePayload, true);
      
      // Subscribe to commands
      String cmdTopic = "parking/commands/" + CONTROLLER_ID;
      client.subscribe(cmdTopic.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      
      // Double blink pattern on error
      for(int i=0; i<2; i++) {
        digitalWrite(STATUS_LED, HIGH); delay(100);
        digitalWrite(STATUS_LED, LOW); delay(100);
      }
      delay(4800);
    }
  }
}

float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m)
  if (duration == 0) return -1;
  
  return duration * 0.034 / 2;
}

void detectStateChange(float distance) {
  String newState = (distance < THRESHOLD_CM) ? "occupied" : "available";
  
  if (newState != currentState) {
    debounceCounter++;
    if (debounceCounter >= DEBOUNCE_READS) {
      currentState = newState;
      debounceCounter = 0;
      publishStatus(currentState);
      
      // LED feedback
      digitalWrite(STATUS_LED, (currentState == "occupied" ? HIGH : LOW));
    }
  } else {
    debounceCounter = 0;
  }
}

void publishStatus(String status) {
  StaticJsonDocument<256> doc;
  doc["slotId"] = SLOT_ID;
  doc["status"] = status;
  doc["controllerId"] = CONTROLLER_ID;
  doc["distance"] = lastDistance;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  
  String topic = "parking/slots/" + String(SLOT_ID);
  if (client.publish(topic.c_str(), buffer, true)) {
    Serial.println("[MQTT] Published: " + SLOT_LABEL + " -> " + status + " (" + String(lastDistance) + "cm)");
  }
}

void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Command received on ");
  Serial.print(topic);
  Serial.print(": ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}
