import paho.mqtt.client as mqtt
import json
import threading
import time
import requests

DATA_FILE = 'sensor_data.csv'

MQTT_ADDRESS = '172.20.10.3'
MQTT_USER = 'cloud'
MQTT_PASSWORD = '123'
DATA_TOPIC = 'esp1_data'
STATUS_TOPIC = 'esp1_identifier'

BUFFER_SIZE = 20
data_buffer = []
buffer_counter = 0
CURRENT_SENDER_ID = "unknown_sender"

def send_to_lambda_blocking(final_payload):
    time.sleep(0.5)

    lambda_data = final_payload

    API_ENDPOINT = "lambda_end_point"

    response = requests.post(
    API_ENDPOINT,
    json=lambda_data,
    headers={'Content-Type': 'application/json'}
    )

    if response.status_code == 200:
        result = response.json()
        print(f"Predicted label: {result['predicted_label']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        print("\n=======================================================")

    print(f"LAMBDA SEND COMPLETE (THREAD):")
    print(f"Start Time: {final_payload['start_time']}")
    print(f"Total Points: {len(final_payload['points'])}")
    print(f"Payload Preview: {json.dumps(final_payload['points'][:3], indent=2)} ...")
    print("=======================================================\n")

def on_connect(client, userdata, flags, rc):
    """ The callback for when the client receives a CONNACK response from the server."""
    print('Connected with result code ' + str(rc))
    client.subscribe(DATA_TOPIC)
    client.subscribe(STATUS_TOPIC)
    print(f"Subscribed to: {DATA_TOPIC} and {STATUS_TOPIC}")

def on_message(client, userdata, msg):
    """The callback for when a PUBLISH message is received from the server."""
    global data_buffer, buffer_counter, CURRENT_SENDER_ID
    if msg.topic == STATUS_TOPIC:
        client_id_received = msg.payload.decode('utf-8')
        CURRENT_SENDER_ID = client_id_received
        print(f"\n*** Received Sender ID: {CURRENT_SENDER_ID} ***")
        return
    if msg.topic != DATA_TOPIC:
        return
    try:
        payload_str = msg.payload.decode('utf-8') 
        data = json.loads(payload_str)
        
        timestamp = data.get("timestamp", "N/A")
        analog_value = data.get("analog", "N/A")
        digital_value = data.get("digital", "N/A")
        if buffer_counter == 0 and digital_value == 1:
            buffer_counter = 1 
            print(f"\n*** TRIGGER START! @ {timestamp} ***")
        if buffer_counter > 0:
            point = {
                "timestamp": timestamp,
                "analog": analog_value,
                "digital": digital_value
            }
            
            data_buffer.append(point)
            
            if buffer_counter == BUFFER_SIZE:
                
                final_payload = {
                    "start_time": data_buffer[0]['timestamp'],
                    "house_id": CURRENT_SENDER_ID,
                    "points": data_buffer
                }
                
                # prevent calling lamda block the refresh of buffer
                sender_thread = threading.Thread(
                    target=send_to_lambda_blocking, 
                    args=(final_payload,)
                )
                sender_thread.start()
                
                data_buffer = [] 
                buffer_counter = 0
                print("--- SEQUENZE COMPLETE. Buffer cleared, send job initiated in background. ---")
            else:
                buffer_counter += 1
                print(f"  [Buffer] Added point {buffer_counter-1}/{BUFFER_SIZE}")

    except json.JSONDecodeError:
        print(f"Error decoding JSON: {msg.payload.decode('utf-8')}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def main():
    mqtt_client = mqtt.Client()
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    mqtt_client.connect(MQTT_ADDRESS, 1883)
    mqtt_client.loop_forever()


if __name__ == '__main__':
    print('MQTT to InfluxDB bridge')
    main()