# NoiseWatcher
Codebase for SUTD's 50.046 Cloud Computing and Internet of Things project

To foster a safe and conducive living environment for residents in HDB flats, we propose the implementation of a Noise Classification and Logging System powered by IoT and cloud technologies.

Our solution comprises three main components:

## 1. Hardware: Smart Noise Monitoring

We deploy ESP32-based noise sensors outside each HDB unit to automatically detect and classify noise levels.
These sensors record sound intensity (in decibels) and, through triangulation, can help identify the central source of noise.
This system fills the gap where CCTV cameras may be insufficient and provides objective, timestamped noise evidence for disputes involving inconsiderate neighbours.
Additionally, the same technology can be extended for domestic abuse detection, or construction noise management, supporting both residential safety and community well-being.

Our project's code is organized into two main folders: `sensors` and `rpi`.

The `sensors` directory contains all our experiment code, including earlier tests with the KY-037 sensor and other setups. The final code used for the deployed system is inside the `INMP441` folder, specifically in the `file publisher_mqtt.py`. To begin, you must first edit this file to include the correct Wi-Fi details that the ESP32 should connect to. After uploading the code to the ESP32, you need to connect the ESP32 to the INMP441 sensor; you can follow the wiring guide in this video: https://www.youtube.com/watch?v=UkJIMCtsypo to allow the ESP32 to successfully receive sound data. This folder also holds older files, such as code under `esp32cam`, which were used when we tested replacing the standard ESP32 with an ESP32-CAM.

The `Rpi` directory contains the core server-side processing logic. The main file, `get_MQTT_data.py`, should be placed and run continuously on the Raspberry Pi throughout the noise monitoring period. This script listens for data sent from the ESP32 using the MQTT protocol. It is responsible for filtering out relevant data frames and then sending the final, processed event summaries to the cloud for classification. To set up the RPi, you should first install the RPi OS using Imager, and ensure the RPi is connected to the same Wi-Fi network as the ESP32. Next, you must set up the MQTT broker service on the RPi; a detailed guide can be found here: https://diyi0t.com/microcontroller-to-raspberry-pi-wifi-mqtt-communication/. Once the RPi is running the MQTT broker and the `get_MQTT_data.py` script, simply power on the ESP32, and the sensors will automatically start collecting and transmitting data to the local server.

## 2. Software: Cloud-Integrated Complaint and Verification System

Residents can submit noise complaints via a centralised web or mobile application by specifying the time and location of the disturbance.
The system cross-references the report against the cloud-based noise logs to validate the complaint.
Government and HDB officials can also access the data to identify unreported or recurring noise incidents, streamlining enforcement.
This significantly reduces the need for residents to file formal police reports and minimises the need for on-site verification by officers, saving time and administrative resources.

## 3. Maintenance and Monitoring

All ESP32 sensors are connected to the cloud infrastructure, allowing remote management and diagnostics.
Periodic ping checks can be sent from the cloud to verify sensor functionality, ensuring the network remains operational.
Any sensor tampering or malfunction (e.g., due to vandalism) can be detected immediately, eliminating the need for manual inspection and improving system reliability.

Business Impact

This solution aligns closely with Singapore’s Smart Nation initiative, addressing the government’s interest in leveraging IoT and data-driven technologies for urban living improvements. Though a solution similar to this has been proposed, it has not been fleshed out or implemented, and our low-cost solution might help facilitate implementation.
By providing accurate, automated, and privacy-conscious noise monitoring, this system promotes neighbourly accountability, assists in law enforcement processes, and contributes to the creation of a harmonious residential environment.
