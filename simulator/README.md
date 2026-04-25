# IoT Smart Parking Simulator

Professional Python MQTT simulator that mimics the behavior of ESP32 hardware with ultrasonic sensors.

## Setup

1. Ensure Python 3.9+ is installed.
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the simulator in one of three modes:

### 1. Auto Mode
Randomly toggles slot statuses every few seconds.
```bash
python simulator.py auto
```

### 2. Manual Mode
Interactive menu to toggle specific slots.
```bash
python simulator.py manual
```

### 3. Scenario Mode
Runs predefined realistic parking patterns.
```bash
python simulator.py scenario <name>
```
Available scenarios:
- `morning_rush`: Slots fill up, then free up.
- `single_cycle`: Basic test for slot A1.
- `full_day`: Accelerated full day simulation.
- `stress_test`: Rapid changes to test system stability.
