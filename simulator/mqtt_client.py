import paho.mqtt.client as mqtt
import json
import uuid
from colorama import Fore, Style, init

init(autoreset=True)

class ParkingMqttClient:
    def __init__(self, broker, port):
        self.broker = broker
        self.port = port
        self.client_id = f"simulator-{str(uuid.uuid4())[:8]}"
        self.client = mqtt.Client(client_id=self.client_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish

    def _on_connect(self, client, userdata, flags, rc, properties):
        if rc == 0:
            print(f"{Fore.GREEN}[CONNECTED] Broker: {self.broker}:{self.port}{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}[FAILED] Connection result code: {rc}{Style.RESET_ALL}")

    def _on_disconnect(self, client, userdata, disconnect_flags, rc, properties):
        print(f"{Fore.RED}[DISCONNECTED]{Style.RESET_ALL}")

    def _on_publish(self, client, userdata, mid, rc, properties):
        # We handle logging in the publish_slot method for better context
        pass

    def connect(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"{Fore.RED}[ERROR] Connection failed: {str(e)}{Style.RESET_ALL}")
            return False

    def publish_slot(self, slot, status):
        payload = {
            "slotId": slot["slotId"],
            "status": status,
            "controllerId": slot["controllerId"]
        }
        topic = slot["topic"]
        
        try:
            result = self.client.publish(topic, json.dumps(payload))
            status_code = result[0]
            if status_code == 0:
                print(f"{Fore.LIGHTBLACK_EX}[PUBLISHED] {topic} -> {status}{Style.RESET_ALL}")
                return True
            else:
                print(f"{Fore.RED}[FAILED PUBLISH] {topic}{Style.RESET_ALL}")
                return False
        except Exception as e:
            print(f"{Fore.RED}[ERROR] Publish error: {str(e)}{Style.RESET_ALL}")
            return False

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
