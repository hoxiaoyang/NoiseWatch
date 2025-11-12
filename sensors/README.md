This folder shows you how to connect the ESP32 to Raspberry Pi using the same hotspot connection. Follow the link: https://diyi0t.com/microcontroller-to-raspberry-pi-wifi-mqtt-communication/ 


Information about files: 
1. mqtt_test.ino: Initiates the ESP32 as the client which is publishing to RPi as the broker. Re-define the variables if anything is changed (eg. mqtt_server IP address which is RPi IP address/port number/wifi pass and username)

2. get_MQTT_data.py: This should already be uploaded on the RPi, and will get the values from broker so that we will send the data to the lambda function endpoint.

** You may see an error when doing `sudo systemctl status mosquitto`, you need to allow the user to be able to read from the password files in RPi (change the mosquitto.conf file)
** Add `log_dest stdout` to config file to see output in terminal
