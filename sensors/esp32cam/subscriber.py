import serial
import os
import struct
import datetime
import time
import json
import threading
import requests

# --- CONFIGURATION (SERIAL CONNECTION) ---
# Check 'ls /dev/tty*' to confirm this name
SERIAL_PORT = '/dev/ttyUSB0' 
BAUD_RATE = 115200

# --- CONFIGURATION (API & BUFFER) ---
API_ENDPOINT = "https://your-api-id.execute-api.region.amazonaws.com/stage/your-path" 
BUFFER_SIZE = 30 # Data points to collect on trigger
DEVICE_ID = "Block 57 unit 801" # Hardcode the ID since we aren't using MQTT IDENTIFIER_TOPIC

# --- GLOBAL STATE ---
data_buffer = []
buffer_counter = 0

# ----------------------------------------------------
# HELPER FUNCTION: LAMBDA SENDER
# ----------------------------------------------------

def send_to_lambda_blocking(final_payload):
    """ Executes the HTTP POST request to the Lambda endpoint in a separate thread. """
    
    # ... (Lambda sending logic remains the same) ...
    
    lambda_data = final_payload
    
    try:
        start_dt = datetime.datetime.fromtimestamp(final_payload['start_time'] / 1000.0)
        start_time_str = start_dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    except Exception:
        start_time_str = "Invalid Time"

    print("\n=======================================================")
    print(f"LAMBDA SEND START - Device ID: {final_payload['house_id']}")
    print(f"Start Time: {start_time_str}")
    print(f"Total Points: {len(final_payload['data'])}")
    print(f"Payload Preview: {json.dumps(final_payload['data'][:3], indent=2)} ...")
    print("=======================================================")
    
    # Execute POST Request
    try:
        response = requests.post(
            API_ENDPOINT,
            json=lambda_data,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ API Success: Predicted label: {result.get('predicted_label', 'No Label')}")
        else:
            print(f"❌ API Error: Status {response.status_code}. Response: {response.text[:100]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network/Connection Error: {e}")

    print("--- LAMBDA SEND COMPLETE ---\n")

# ----------------------------------------------------
# MAIN RECEIVER FUNCTION (Serial Listener)
# ----------------------------------------------------

def serial_listener():
    global data_buffer, buffer_counter
    
    # 1. Setup Serial Connection
    try:
        # Note: timeout=None for blocking read, but we use a small timeout for robustness
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.5) 
        ser.reset_input_buffer()
        print(f"✅ Serial connection established on {SERIAL_PORT} at {BAUD_RATE} baud.")
    except serial.SerialException as e:
        print(f"❌ Error opening serial port: {e}")
        print("   -> Check wiring, power, and confirm the port name (/dev/ttyUSB0).")
        return
        
    print(f"Listening for acoustic data from ESP32-CAM ({DEVICE_ID})...")
    
    while True:
        try:
            # 2. Read Data Line
            line = ser.readline().decode('utf-8').strip()
            
            if not line:
                continue
            
            # Data format: "RMS_VALUE|DIGITAL_TRIGGER"
            parts = line.split('|')
            if len(parts) != 2:
                # print(f"Warning: Skipping malformed line: {line}") # Uncomment for deeper debugging
                continue

            # 3. Parse Data
            try:
                analog_value_float = float(parts[0])
                digital_value_int = int(parts[1])
            except ValueError:
                # print("Warning: Skipping line due to parsing error.")
                continue

            # Generate precise timestamp at time of receipt (since ESP32-CAM doesn't have NTP time)
            timestamp_float = time.time() * 1000.0
            
            # --- Trigger and Buffering Logic ---
            
            # Trigger Start: Start buffering ONLY when buffer is empty AND digital state is 1
            if buffer_counter == 0 and digital_value_int == 1:
                buffer_counter = 1 
                print(f"\n*** TRIGGER START! - RMS: {analog_value_float:.2f} ***") 
            
            # Buffering Logic
            if buffer_counter > 0:
                point = {
                    "timestamp": timestamp_float,
                    "analog_value": analog_value_float
                }
                data_buffer.append(point)
                
                # CRITICAL: Increment the counter after a point is added
                buffer_counter += 1
                
                # Check if we have collected the required number of samples (BUFFER_SIZE=30)
                if buffer_counter > BUFFER_SIZE: 
                    print(f"✅ Buffer Full. Preparing to send {len(data_buffer)} points.")
                    
                    final_payload = {
                        "start_time": data_buffer[0]['timestamp'],
                        "house_id": DEVICE_ID, 
                        "data": data_buffer
                    }
                    
                    # Send in Background Thread
                    sender_thread = threading.Thread(
                        target=send_to_lambda_blocking, 
                        args=(final_payload,)
                    )
                    sender_thread.start()
                    
                    # Reset state
                    data_buffer = [] 
                    buffer_counter = 0

        except KeyboardInterrupt:
            print("\nExiting serial listener.")
            break
        except Exception as e:
            print(f"An unexpected runtime error occurred: {e}")
            time.sleep(1)
            
    if 'ser' in locals() and ser.is_open:
        ser.close()

if __name__ == '__main__':
    serial_listener()