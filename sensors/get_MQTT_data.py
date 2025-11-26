import paho.mqtt.client as mqtt

MQTT_ADDRESS = '172.20.10.3'
MQTT_USER = 'cloud'
MQTT_PASSWORD = '123'
MQTT_TOPIC_A = 'analog'
MQTT_TOPIC_D = 'digital'
MQTT_TOPIC_T = 'timestamp'

def on_connect(client, userdata, flags, rc):
    """ The callback for when the client receives a CONNACK response from the server."""
    print('Connected with result code ' + str(rc))
    client.subscribe(MQTT_TOPIC_A)
    client.subscribe(MQTT_TOPIC_D)
    client.subscribe(MQTT_TOPIC_T)

def on_message(client, userdata, msg):
    """The callback for when a PUBLISH message is received from the server."""
    print(msg.topic + ' ' + str(msg.payload))

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