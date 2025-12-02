import paho.mqtt.client as mqtt
import datetime
import os
import sys
import json
import threading # Still needed for logging in a separate thread

# --- CONFIGURATION ---
MQTT_ADDRESS = '172.20.10.3'
MQTT_USER = 'cloud'
MQTT_PASSWORD = '123'
DATA_TOPIC = 'esp1_data'      
STATUS_TOPIC = 'esp1_identifier' 

# --- LOGGING CONFIG (Filename changed from .jsonl to .json) ---
# Use the user's home directory (~) to ensure a predictable location.
HOME_DIR = os.path.expanduser('~')
LOG_DIR = os.path.join(HOME_DIR, 'high_speed_raw_logs')
# Filename extension changed to .json for single output file
RAW_LOG_FILENAME = os.path.join(LOG_DIR, f"log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

# --- AGGREGATION CONFIG ---
# Collect 3000 entries (30 seconds @ 10ms interval) before writing to file.
AGGREGATION_THRESHOLD = 3000 
# Calculate the duration based on the 100 Hz (0.01s) sampling rate
AGGREGATION_DURATION_SECONDS = AGGREGATION_THRESHOLD * 0.01

# --- GLOBAL STATE ---
aggregation_buffer = [] 
CURRENT_SENDER_ID = "unknown_sender" 
# New flag to indicate the first aggregation is complete and the program should exit
SHOULD_EXIT = False 

# ----------------------------------------------------
# HELPER FUNCTION: AGGREGATION & LOGGING
# ----------------------------------------------------
def aggregate_and_log_data(buffer):
    """
    Formats the collected buffer into the structured JSON format 
    and writes it to the log file, then sets the exit flag.
    """
    global SHOULD_EXIT
    try:
        now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        
        # Structure the data according to the desired format
        aggregated_doc = {
            "aggregation_duration_seconds": AGGREGATION_DURATION_SECONDS,
            "total_entries": len(buffer),
            "generated_at": now_str,
            "sensor_data": buffer 
        }
        
        # Convert the Python dictionary to a formatted JSON string
        log_entry = json.dumps(aggregated_doc, indent=4)
        
        # Write the structured JSON object to the file, overwriting if necessary
        # We use 'w' (write) because we only log one aggregate object per run
        with open(RAW_LOG_FILENAME, 'w') as f: 
            f.write(log_entry)
            
        print(f"✅ Logged final aggregate data ({len(buffer)} points) to {RAW_LOG_FILENAME}")
        
        # CRITICAL: Set the global flag to signal the loop to exit
        SHOULD_EXIT = True 
            
    except Exception as e:
        print(f"❌ LOGGING ERROR: Failed to aggregate and write to file: {e}", file=sys.stderr)

# ----------------------------------------------------
# MQTT CALLBACKS (Listener Logic)
# ----------------------------------------------------

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker with result code {rc}")
    
    client.subscribe(DATA_TOPIC)
    client.subscribe(STATUS_TOPIC)
    print(f"Subscribed to: {DATA_TOPIC} and {STATUS_TOPIC}")

# Note: on_message logic is kept the same, as it only buffers
def on_message(client, userdata, msg):
    """Called when a message is received. Appends to buffer and checks threshold."""
    global aggregation_buffer, CURRENT_SENDER_ID
    
    if msg.topic == STATUS_TOPIC:
        CURRENT_SENDER_ID = msg.payload.decode('utf-8')
        print(f"\n✅ DEVICE IDENTIFIED: {CURRENT_SENDER_ID}. Starting high-speed buffering.")
        return
        
    if msg.topic != DATA_TOPIC:
        return
        
    # Check the exit flag first; if True, stop processing messages
    if SHOULD_EXIT:
        return

    try:
        payload_str = msg.payload.decode('utf-8') 
        data = json.loads(payload_str)
        
        # Restructure single point to match the desired keys in the final JSON array
        single_point = {
            "timestamp": data.get("timestamp"),
            "analog_value": data.get("analog"), 
            "digital_value": data.get("digital") 
        }
        
        # 1. Add to buffer
        aggregation_buffer.append(single_point)
        
        # 2. Check if threshold is met
        if len(aggregation_buffer) >= AGGREGATION_THRESHOLD:
            # Create a copy of the buffer before clearing, in case logging takes time
            buffer_to_log = aggregation_buffer[:]
            aggregation_buffer.clear()
            
            print(f"\n⏳ Threshold met ({AGGREGATION_THRESHOLD} points). Compiling final JSON...")
            
            # Log in a separate thread to prevent blocking the MQTT loop
            # This thread will set the global SHOULD_EXIT flag to True upon completion
            log_thread = threading.Thread(
                target=aggregate_and_log_data, 
                args=(buffer_to_log,)
            )
            log_thread.start()

    except json.JSONDecodeError:
        print(f"Error: Invalid JSON received: {payload_str}", file=sys.stderr)
    except Exception as e:
        print(f"Error processing message: {e}", file=sys.stderr)

# ----------------------------------------------------
# MAIN EXECUTION
# ----------------------------------------------------
def main():
    # 1. Setup Log Directory
    os.makedirs(LOG_DIR, exist_ok=True)
    print(f"Starting raw data logger. Target: 1 aggregation ({AGGREGATION_DURATION_SECONDS}s).")
    print(f"Output file: {RAW_LOG_FILENAME}")

    # 2. Setup MQTT Client
    mqtt_client = mqtt.Client() 
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    # 3. Connect and Loop
    try:
        mqtt_client.connect(MQTT_ADDRESS, 1883)
        
        # Use a non-blocking loop (loop_start) and check the global exit flag
        mqtt_client.loop_start() 
        
        # Wait for the exit flag to be set by the aggregate_and_log_data thread
        while not SHOULD_EXIT:
            time.sleep(0.1) 

        # Once SHOULD_EXIT is True, stop the loop and disconnect
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        
        print("\n✅ Aggregation complete. Program exited gracefully.")

    except KeyboardInterrupt:
        print("\nLogger stopped by user (Keyboard Interrupt).")
        # Ensure remaining data is logged before manual exit
        if aggregation_buffer:
            print("Logging remaining buffer data before exit...")
            aggregate_and_log_data(aggregation_buffer)
    except Exception as e:
        print(f"Fatal connection error: {e}", file=sys.stderr)

if __name__ == '__main__':
    # Import threading and time here as they are now needed in main
    import threading 
    import time
    main()