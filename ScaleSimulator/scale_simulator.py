import serial
import time
import random
import argparse
from datetime import datetime
import sys

# Configuration defaults
PORT_NAME = "COM8"
BAUD_RATE = 9600
DATA_BITS = serial.EIGHTBITS
PARITY = serial.PARITY_NONE
STOP_BITS = serial.STOPBITS_ONE
TIMEOUT = 1

MIN_WEIGHT = 0.0
MAX_WEIGHT = 50.0
INTERVAL_MS = 1000
RANDOM_MIN_MS = 1000
RANDOM_MAX_MS = 6000

def main():
    parser = argparse.ArgumentParser(description='Scale simulator: static or random interval')
    parser.add_argument('--mode', choices=['static', 'random'], default='static', help='Interval mode')
    parser.add_argument('--interval-ms', type=int, default=INTERVAL_MS, help='Static interval in milliseconds')
    parser.add_argument('--random-min-ms', type=int, default=RANDOM_MIN_MS, help='Random mode min interval in milliseconds')
    parser.add_argument('--random-max-ms', type=int, default=RANDOM_MAX_MS, help='Random mode max interval in milliseconds')
    parser.add_argument('--port', default=PORT_NAME, help='Serial port name')
    args = parser.parse_args()

    if args.mode == 'random' and args.random_min_ms > args.random_max_ms:
        parser.error('--random-min-ms must be <= --random-max-ms')

    print("===========================================")
    print("BALANCE AGENT SERVICE - SCALE SIMULATOR")
    print("===========================================")
    print(f"Port: {args.port}")
    print(f"Baud Rate: {BAUD_RATE}")
    print(f"Weight Range: {MIN_WEIGHT}-{MAX_WEIGHT} kg")
    print(f"Mode: {args.mode}")
    if args.mode == 'static':
        print(f"Interval: {args.interval_ms} ms")
    else:
        print(f"Random interval range: {args.random_min_ms}-{args.random_max_ms} ms")
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

                if args.mode == 'static':
                    sleep_ms = args.interval_ms
                else:
                    sleep_ms = random.randint(args.random_min_ms, args.random_max_ms)

                time.sleep(sleep_ms / 1000.0)
                
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
