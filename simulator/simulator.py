import sys
import json
import time
import random
import os
from dotenv import load_dotenv
from colorama import Fore, Style, init
from mqtt_client import ParkingMqttClient
from sensor_logger import UltrasonicSensor

# Initialize colorama
init(autoreset=True)

# Load config and env
load_dotenv()
with open('slots_config.json', 'r') as f:
    config = json.load(f)

BROKER = os.getenv('MQTT_BROKER', 'localhost')
PORT = int(os.getenv('MQTT_PORT', 1883))
INTERVAL = float(os.getenv('SIMULATION_INTERVAL', 3))

# Initialize components
client = ParkingMqttClient(BROKER, PORT)
sensors = {s['slotId']: UltrasonicSensor(s['label']) for s in config['slots']}
slot_data = {s['slotId']: s for s in config['slots']}
current_states = {s['slotId']: 'available' for s in config['slots']}

def print_status_table():
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"+--------------------------------------------------+")
    print(f"|             PARKING SLOT SIMULATOR               |")
    print(f"|--------------------------------------------------|")
    print(f"|  Current System Status:                          |")
    for sid, slot in slot_data.items():
        state = current_states[sid]
        color = Fore.RED if state == 'occupied' else Fore.GREEN
        print(f"|  [{slot['label']}] {color}{state:<10}{Style.RESET_ALL}  ({slot['controllerId']})      |")
    print(f"|--------------------------------------------------|")

def update_slot(slot_id, new_status):
    current_states[slot_id] = new_status
    sensors[slot_id].set_state(new_status == 'occupied')
    
    # Simulate hardware flow: sensor read -> decision -> publish
    distance = sensors[slot_id].read_distance()
    log = sensors[slot_id].get_reading_log(distance)
    
    print(f"{Fore.CYAN}[SENSOR] {log['slot']}: {log['distance_cm']}cm -> {log['occupied']}{Style.RESET_ALL}")
    
    success = client.publish_slot(slot_data[slot_id], new_status)
    return success

def run_auto():
    print(f"{Fore.YELLOW}[MODE] AUTO started. Toggling random slots every {INTERVAL}s...{Style.RESET_ALL}")
    try:
        while True:
            # Pick 1-2 random slots to toggle
            num_to_toggle = random.randint(1, 2)
            s_ids = random.sample(list(slot_data.keys()), num_to_toggle)
            
            for sid in s_ids:
                new_status = 'occupied' if current_states[sid] == 'available' else 'available'
                update_slot(sid, new_status)
                print(f"{Fore.MAGENTA}[AUTO] {slot_data[sid]['label']} -> {new_status}{Style.RESET_ALL}")
            
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        cleanup()

def run_manual():
    while True:
        print_status_table()
        print(f"|  Commands:                                       |")
        print(f"|  1-5  -> toggle slot status                       |")
        print(f"|  a    -> set ALL occupied                         |")
        print(f"|  c    -> clear ALL (available)                    |")
        print(f"|  s    -> show status                              |")
        print(f"|  q    -> quit                                     |")
        print(f"+--------------------------------------------------+")
        
        cmd = input("Command > ").lower()
        
        if cmd == 'q':
            cleanup()
            break
        elif cmd == 'a':
            for sid in slot_data:
                update_slot(sid, 'occupied')
        elif cmd == 'c':
            for sid in slot_data:
                update_slot(sid, 'available')
        elif cmd == 's':
            continue
        elif cmd.isdigit():
            idx = int(cmd)
            if idx in slot_data:
                new_status = 'occupied' if current_states[idx] == 'available' else 'available'
                update_slot(idx, new_status)
            else:
                print(f"Invalid slot number: {idx}")
                time.sleep(1)
        else:
            print("Unknown command")
            time.sleep(1)

def run_scenario(name):
    print(f"{Fore.YELLOW}[MODE] SCENARIO: {name}{Style.RESET_ALL}")
    
    if name == 'morning_rush':
        # Fill up
        for sid in slot_data:
            update_slot(sid, 'occupied')
            time.sleep(2)
        print(f"{Fore.CYAN}Waiting 10s at full capacity...{Style.RESET_ALL}")
        time.sleep(10)
        # Clear out
        for sid in slot_data:
            update_slot(sid, 'available')
            time.sleep(2)

    elif name == 'single_cycle':
        sid = 1 # A1
        update_slot(sid, 'occupied')
        print(f"{Fore.CYAN}Brought into occupation. Waiting 5s...{Style.RESET_ALL}")
        time.sleep(5)
        update_slot(sid, 'available')

    elif name == 'full_day':
        # hour = 2 real seconds
        # Morning (3 hours): Fill 4 slots
        print(f"{Fore.YELLOW}SIMULATED TIME: 08:00 (Morning Rush){Style.RESET_ALL}")
        for sid in [1, 2, 3, 4]:
            update_slot(sid, 'occupied')
            time.sleep(2) # 1 simulated hour
        
        # Midday (3 hours): Steady
        print(f"{Fore.YELLOW}SIMULATED TIME: 12:00 (Midday Static){Style.RESET_ALL}")
        time.sleep(6) # 3 hours
        
        # Afternoon (3 hours): Turnover
        print(f"{Fore.YELLOW}SIMULATED TIME: 15:00 (Afternoon Turnover){Style.RESET_ALL}")
        update_slot(1, 'available')
        time.sleep(2)
        update_slot(5, 'occupied')
        time.sleep(4)
        
        # Evening (3 hours): Cleanup
        print(f"{Fore.YELLOW}SIMULATED TIME: 18:00 (Closing State){Style.RESET_ALL}")
        for sid in slot_data:
            if current_states[sid] == 'occupied':
                update_slot(sid, 'available')
                time.sleep(2)

    elif name == 'stress_test':
        print(f"{Fore.RED}[WARNING] Starting Stress Test (30s intense traffic)...{Style.RESET_ALL}")
        end_time = time.time() + 30
        while time.time() < end_time:
            sid = random.choice(list(slot_data.keys()))
            new_status = 'occupied' if current_states[sid] == 'available' else 'available'
            update_slot(sid, new_status)
            time.sleep(0.5)

    cleanup()

def cleanup():
    print(f"{Fore.YELLOW}[CLEANUP] Setting all slots to available before exit...{Style.RESET_ALL}")
    for sid in slot_data:
        if current_states[sid] == 'occupied':
            update_slot(sid, 'available')
    client.disconnect()
    print("Simulator stopped.")

if __name__ == "__main__":
    if not client.connect():
        sys.exit(1)
        
    mode = sys.argv[1] if len(sys.argv) > 1 else 'manual'
    
    if mode == 'auto':
        run_auto()
    elif mode == 'manual':
        run_manual()
    elif mode == 'scenario':
        if len(sys.argv) > 2:
            run_scenario(sys.argv[2])
        else:
            print("Usage: python simulator.py scenario <name>")
            cleanup()
    else:
        print("Unknown mode. Use: auto, manual, or scenario")
        cleanup()
