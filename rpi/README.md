We need to set up Raspberry Pi as the main IoT thing. ESP32 will all send data here. RPi will use MQTT to interact with IoT core to publish the sound sensor data. We will then call Lambda function from the IoT rule to send data to Lambda function (which is alr configured to store data in DynamoDB)

To remotely access the RPi, you have to make sure to boot the OS with the correct credentials (use hotspot)
1. Add ssh (WITH NO .txt EXTENSION) into boot folder
2. Add wpa_supplicant.conf file (WITH NO .txt EXTENSION) into boot folder

ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=SG

network={
    ssid="hotspot_name"
    psk="password"
    key_mgmt=WPA-PSK
}

Be patient and wait.