import paho.mqtt.client as mqtt
import json
import time

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

client = mqtt.Client()
client.on_connect = on_connect

client.connect("localhost", 1883, 60)

# Simulate Slot A1 becoming available
payload = {
    "slotId": 1,
    "status": "available",
    "controllerId": "ESP32-A1"
}

print(f"Publishing: {payload}")
client.publish("parking/slots/ESP32-A1", json.dumps(payload))

# Wait a bit for the backend to process
time.sleep(2)

client.disconnect()
