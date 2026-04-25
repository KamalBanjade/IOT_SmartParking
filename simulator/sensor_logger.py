import random
from datetime import datetime

class UltrasonicSensor:
    def __init__(self, slot_label, threshold_cm=20):
        self.slot_label = slot_label
        self.threshold_cm = threshold_cm
        self.current_should_be_occupied = False

    def read_distance(self):
        """Simulates distance reading with noise."""
        if self.current_should_be_occupied:
            # Distance when occupied: 5-15 cm
            base = random.uniform(5, 15)
        else:
            # Distance when available: 30-80 cm
            base = random.uniform(30, 80)
        
        # Add ±2cm noise to simulate jitter/interference
        noise = random.uniform(-2, 2)
        return round(base + noise, 2)

    def is_occupied(self, distance):
        return distance < self.threshold_cm

    def get_reading_log(self, distance):
        occupied = self.is_occupied(distance)
        return {
            "slot": self.slot_label,
            "distance_cm": distance,
            "occupied": occupied,
            "threshold_cm": self.threshold_cm,
            "timestamp": datetime.now().isoformat()
        }

    def set_state(self, is_occupied):
        self.current_should_be_occupied = is_occupied
