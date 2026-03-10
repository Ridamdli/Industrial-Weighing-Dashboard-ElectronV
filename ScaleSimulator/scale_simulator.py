import serial
import time
import random
from datetime import datetime
import sys

# Configuration
PORT_NAME = "COM8"
BAUD_RATE = 9600
DATA_BITS = serial.EIGHTBITS
PARITY = serial.PARITY_NONE
STOP_BITS = serial.STOPBITS_ONE
TIMEOUT = 1

MIN_WEIGHT = 0.0
MAX_WEIGHT = 50.0
INTERVAL_MS = 1000

def main():
    print("===========================================")
    print("BALANCE AGENT SERVICE - SCALE SIMULATOR")
    print("===========================================")
    print(f"Port: {PORT_NAME}")
    print(f"Baud Rate: {BAUD_RATE}")
    print(f"Weight Range: {MIN_WEIGHT}-{MAX_WEIGHT} kg")
    print(f"Interval: {INTERVAL_MS}ms")
    print("===========================================\n")
    
    try:
        with serial.Serial(
            port=PORT_NAME,
            baudrate=BAUD_RATE,
            bytesize=DATA_BITS,
            parity=PARITY,
            stopbits=STOP_BITS,
            timeout=TIMEOUT
        ) as ser:
            print(f"[OK] Connected to {PORT_NAME}")
            print("[INFO] Sending weight data... (Press Ctrl+C to stop)\n")
            
            count = 0
            while True:
                weight = random.uniform(MIN_WEIGHT, MAX_WEIGHT)
                data = f"{weight:.2f} kg\r\n"
                
                ser.write(data.encode('ascii'))
                count += 1
                
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[{count}] {timestamp} -> {repr(data)}")
                
                time.sleep(INTERVAL_MS / 1000.0)
                
    except serial.SerialException as e:
        print(f"\n[ERROR] {e}")
        print("\n[INFO] Make sure:")
        print("   1. Virtual COM port pair is created (COM7 <-> COM8)")
        print("   2. BalanceAgentService is configured for COM7")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n[STOP] Simulator stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()
