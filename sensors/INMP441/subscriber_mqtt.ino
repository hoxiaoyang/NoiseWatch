import paho.mqtt.client as mqtt
import json
import threading
import time
import requests
import datetime

# --- CONFIGURATION ---
MQTT_ADDRESS = '127.0.0.1'
MQTT_USER = 'cloud'
MQTT_PASSWORD = '123'
DATA_TOPIC = 'esp1_data'      # Data from ESP32
STATUS_TOPIC = 'esp1_identifier' # ID from ESP32
API_ENDPOINT = ""

# --- GLOBAL STATE ---
BUFFER_SIZE = 30 
data_buffer = []
buffer_counter = 0
CURRENT_SENDER_ID = "unknown_sender" 

def send_to_lambda_blocking(final_payload):
    """ Executes the HTTP POST request to the Lambda endpoint in a separate thread. """
    
    lambda_data = final_payload
    
    # Format the numeric Unix time for readable logging
    try:
        # start_time is already in Unix MS from the ESP32
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

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe(DATA_TOPIC)
    client.subscribe(STATUS_TOPIC)
    print(f"Subscribed to: {DATA_TOPIC} and {STATUS_TOPIC}")

def on_message(client, userdata, msg):
    global data_buffer, buffer_counter, CURRENT_SENDER_ID

    if msg.topic == STATUS_TOPIC:
        CURRENT_SENDER_ID = msg.payload.decode('utf-8')
        print(f"\n🎉 DEVICE IDENTIFIED: {CURRENT_SENDER_ID}. Ready to acquire data.")
        return

    if msg.topic != DATA_TOPIC:
        return
        
    try:
        payload_str = msg.payload.decode('utf-8') 
        data = json.loads(payload_str)
        
        # 1. Direct Numeric Timestamp Reading (from ESP32)
        # The timestamp is sent as a long long integer (milliseconds)
        timestamp_float = float(data.get("timestamp", 0))
        
        analog_value_float = float(data.get("analog", 0))
        digital_value_int = int(data.get("digital", 0))

        if CURRENT_SENDER_ID == "unknown_sender":
            return
            
        # 3. Trigger Logic
        if buffer_counter == 0 and digital_value_int == 1:
            buffer_counter = 1 
            print(f"\n*** TRIGGER START! - RMS: {analog_value_float:.2f} ***") 
        
        # 4. Buffering Logic
        if buffer_counter > 0:
            point = {
                "timestamp": timestamp_float,
                "analog_value": analog_value_float
            }
            data_buffer.append(point)
            
            # CRITICAL: Increment the counter after a point is added
            buffer_counter += 1
            
            if buffer_counter > BUFFER_SIZE: 
                print(f"✅ Buffer Full. Preparing to send {len(data_buffer)} points.")
                
                final_payload = {
                    "start_time": data_buffer[0]['timestamp'],
                    "house_id": CURRENT_SENDER_ID, 
                    "data": data_buffer
                }
                
                sender_thread = threading.Thread(
                    target=send_to_lambda_blocking, 
                    args=(final_payload,)
                )
                sender_thread.start()
                
                data_buffer = [] 
                buffer_counter = 0

    except Exception as e:
        print(f"Error processing message: {e}")
        pass 

def main():
    mqtt_client = mqtt.Client() 
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    mqtt_client.connect(MQTT_ADDRESS, 1883)
    mqtt_client.loop_forever()


if __name__ == '__main__':
    main()