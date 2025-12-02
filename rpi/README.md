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

Steps to do after load OS:

0. ssh-keygen -R 172.20.10.3

1. reboot and install mosquitto
sudo reboot
sudo rm -rf /usr/share/man/man8/mosquitto.8.gz*
sudo rm -rf /var/cache/apt/archives/mosquitto*

sudo dpkg --configure -a 
sudo apt-get clean 
sudo apt-get update

sudo apt-get install -o Dpkg::Options::="--force-overwrite" mosquitto

2. re edit config
sudo nano /etc/mosquitto/mosquitto.conf (refer to the link)

do these to the conf file:
The broker should only include the default settings. That is done be comment the line where the conf.d file is included.
We do not want anonymous users to connected to the MQTT broker: allow_anonymous false
We want to save the passwords in a separate file: password_file /etc/mosquitto/pwfile
The MQTT broker should be accessible on port 1883: listener 1883

3. create password file
	
sudo mosquitto_passwd -c /etc/mosquitto/pwfile cloud

password: 123

4. set permission for password file:
sudo chown mosquitto:mosquitto /etc/mosquitto/pwfile
sudo chmod 600 /etc/mosquitto/pwfile

5. install python on rpi

sudo apt update
sudo apt install python3

6. install paho system wide using pip on rpi

sudo pip install paho-mqtt requests --break-system-packages

7. add get_MQTT_data.py copy from repo, change endpoint to actual 

8. check mqtt broker status
sudo systemctl status mosquitto

9.run 
python get_MQTT_data.py


to solve Reading package lists... Error!                            
Error: Unable to parse package file /var/lib/apt/lists/archive.raspberrypi.com_debian_dists_trixie_main_binary-arm64_Packages (1)
Error: Unable to parse package file /var/lib/apt/lists/archive.raspberrypi.com_debian_dists_trixie_main_binary-armhf_Packages (1)
Warning: You may want to run apt-get update to correct these problems
Error: The package cache file is corrupted

do

rsp@rsp:~ $ sudo apt clean
rsp@rsp:~ $ sudo rm -rf /var/lib/apt/lists/*
rsp@rsp:~ $ sudo apt update


if esp32 fail to connect to broker

do

rsp@rsp:~ $ sudo systemctl stop mosquitto
rsp@rsp:~ $ sudo rm /etc/mosquitto/pwfile
rsp@rsp:~ $ sudo mosquitto_passwd -c /etc/mosquitto/pwfile cloud
Password: 
Reenter password: 
rsp@rsp:~ $ sudo chown mosquitto:mosquitto /etc/mosquitto/pwfile
rsp@rsp:~ $ sudo chmod 600 /etc/mosquitto/pwfile
rsp@rsp:~ $ sudo systemctl start mosquitto
rsp@rsp:~ $ python get_MQTT_data.py