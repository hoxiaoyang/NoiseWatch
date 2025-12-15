# NoiseWatcher
*A Smart Noise Monitoring and Logging System for HDB Estates*

**SUTD 50.046 Cloud Computing and Internet of Things Project**

---

## Problem Statement

Noise disputes in HDB flats are increasingly common, yet residents face significant challenges when attempting to resolve them. Current solutions rely heavily on manual evidence collection, which is often unverified and insufficient for formal complaints. CCTV systems cannot capture acoustic disturbances, and the burden of proof falls entirely on affected residents. This creates friction between neighbors, wastes administrative resources, and leaves genuine noise issues unresolved.

## Solution Overview

To address these challenges and foster a safer, more harmonious living environment, we present **NoiseWatcher** - a smart, scalable, and privacy-preserving noise monitoring and logging system designed specifically for HDB estates. 

Leveraging IoT sensors, cloud services, and machine learning, NoiseWatcher captures real-time acoustic data, classifies noise events, and securely stores verified logs for residents and administrators. Our solution automates evidence collection, enhances the accuracy of noise classification, and simplifies the dispute resolution process. 

With features such as sensor health monitoring, noise log verification, and retrainable ML models, NoiseWatcher offers a robust, end-to-end system that overcomes the limitations of existing tools while maintaining affordability, scalability, and user trust.

---

## Architecture Overview

NoiseWatcher is built on a three-tier architecture:

1. **IoT Layer**: INMP441 sensors deployed outside each HDB unit, connected to ESP32 microcontrollers
2. **Edge Processing Layer**: Local servers (Raspberry Pi) in each block, running AWS Greengrass and MQTT broker
3. **Cloud Layer**: AWS services including Lambda, DynamoDB, S3, API Gateway, and Cognito for processing, storage, and authentication

---

## Key Features

Our solution is built around four key features that work together to provide accurate, reliable, and scalable noise monitoring for HDB estates.

### Feature 1: Smart Noise Monitoring

**Purpose**: Automated, privacy-preserving acoustic event detection and classification.

**Implementation**:
- **Hardware**: INMP441 sensors installed outside every housing unit capture acoustic events that cannot be observed through CCTV while preserving resident privacy
- **Data Collection**: Sensors automatically collect data from 10pm to 8am every day
- **Local Processing**: A local server (Raspberry Pi) is installed for every block, handling noise data from all sensors within that block
- **AWS Integration**: Local servers are registered as AWS Greengrass IoT Core devices, authenticated with API keys from AWS API Gateway
- **Resilient Protocol**: MQTT ensures devices continue collecting data even during internet disconnections, syncing when reconnected
- **Intelligent Filtering**: All requests are filtered at the local server level to limit HTTP POST requests to the noise inference Lambda function
- **Automated Classification**: Filtered noise logs above a threshold are sent to API Gateway, where Lambda functions perform ML inference and assign noise classifications
- **Data Storage**: Classified noise logs are automatically stored in DynamoDB

**Benefits**: Fully automated logging and classification reduces the burden on residents to manually collect noise data, which can be unverified and inaccurate.

### Feature 2: Noise Log Verification

**Purpose**: Trusted, authenticated noise record access for residents and administrators.

**Implementation**:
- **Centralized Platform**: Web and mobile application provides access to verified noise records
- **Search Functionality**: Residents can search by timestamp range, location (unit number), and noise classification
- **Direct Database Access**: Application queries DynamoDB directly for real-time, up-to-date noise logs
- **Integrated Complaint Filing**: Residents can file complaints directly in the application using verified noise data as evidence

**Benefits**: Convenient retrieval of authenticated noise logs anytime, anywhere, streamlining the complaint process and providing objective evidence for dispute resolution.

### Feature 3: Retraining and Finetuning

**Purpose**: Continuous improvement of ML model accuracy as new noise patterns emerge.

**Implementation**:
- **Administrator Access**: Dedicated admin login via AWS Cognito authentication
- **Dual Training Modes**: Administrators can choose between fine-tuning existing models or full retraining
- **Model Storage**: ML models are stored in S3 buckets for version control and deployment
- **Containerized Training**: Docker containers encapsulate Python ML libraries and dependencies for consistent, reproducible training
- **AWS SageMaker Integration**: Training pipelines deployed on SageMaker for scalable model development
- **Automated Deployment**: Newly trained models are automatically deployed to Lambda inference functions

**Benefits**: Abstracts manual ML model retraining efforts from administrators while ensuring the system adapts to evolving noise patterns and new noise classifications.

### Feature 4: Maintenance and Monitoring

**Purpose**: System reliability through proactive sensor health monitoring.

**Implementation**:
- **Device Registry**: DynamoDB database maintains records of all ESP32 sensors
- **MQTT "Last Will"**: Leverages MQTT's "Time of Death" (Last Will and Testament) feature for automatic status detection
- **Automatic Status Updates**: Local servers send Last Will messages to Lambda functions when sensors disconnect
- **Real-time Status Tracking**: Sensor status (online/offline) is updated in DynamoDB in real-time
- **Admin Dashboard**: Administrators can query Lambda functions to retrieve status of all sensors at a glance
- **Proactive Maintenance**: Quick identification of faulty or unresponsive sensors enables timely replacements

**Benefits**: Eliminates the need for manual sensor inspections, reduces system downtime, and ensures consistent monitoring coverage across all units.

---

## Project Structure

All Documentation for each section is written in each folder's README.md.

### `/app`
Code for the UI of the Noise Complaint System (TypeScript). All backend functions are linked to AWS services.

**To run this:**
```bash
npm install
npm run dev
```

### `/aws_sagemaker`
Code for the AWS SageMaker model finetuning instance (Python).
- `train.py`: Training script for AWS SageMaker
- `preprocessing.py`: Data preprocessing and feature extraction modules
- `feature_extract.py`: Feature engineering for model training
- Model evaluation and deployment logic

### `/lambda`
Code for all four deployed Lambda functions (Python):
- Noise inference and classification
- Sensor status monitoring
- Model retraining triggers
- Database query handlers

### `/noise_prediction`
Code and raw data for local training of the noise classification model (Python). 

**Usage**: Run all cells in `train.ipynb` to inspect how training and evaluation is performed.

Contains:
- `train.ipynb`: Interactive notebook for model development
- `/sample_data`: Training and test datasets
- Feature extraction and preprocessing utilities

### `/rpi`
Code for script to be transferred to Raspberry Pi for MQTT (Python).
- `get_MQTT_data.py`: Main script running continuously on Raspberry Pi
  - Listens for MQTT data from ESP32 sensors
  - Filters relevant data frames
  - Forwards processed events to cloud for classification

### `/sensors`
Code for ESP32s to obtain data from sound sensors (C++).

Contains all experiment code and sensor implementations:
- **`/INMP441`**: Final production code
  - `publisher_mqtt.py`: Main ESP32 firmware for data collection and transmission
  - Configuration: Edit Wi-Fi credentials before uploading to ESP32
- **`/esp32cam`**: Earlier tests with ESP32-CAM variant
- **`/KY-037`**: Initial experiments with KY-037 sensor

---

## Technology Stack

**Hardware**:
- ESP32 microcontrollers
- INMP441 I2S MEMS microphones
- Raspberry Pi (local edge servers)

**Cloud Services**:
- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- AWS API Gateway
- AWS SageMaker

**Communication**:
- MQTT protocol
- REST APIs

**Machine Learning**:
- Python (scikit-learn, pandas, numpy)
- Docker

---

## Business Impact

NoiseWatcher aligns closely with Singapore's Smart Nation initiative, addressing the government's interest in leveraging IoT and data-driven technologies for urban living improvements. While similar solutions have been proposed, they have not been fully implemented or fleshed out. Our low-cost, scalable solution might help facilitate widespread implementation.

**Key Benefits**:
- **Automated Evidence Collection**: Reduces burden on residents
- **Objective Verification**: Timestamped, classified noise logs provide reliable evidence
- **Privacy-Preserving**: Audio data is processed locally; only classifications are stored
- **Scalable**: Cloud-native architecture supports city-wide deployment
- **Cost-Effective**: Affordable hardware and serverless computing minimize operational costs
- **Proactive Enforcement**: Enables administrators to identify unreported recurring issues

By providing accurate, automated, and privacy-conscious noise monitoring, NoiseWatcher promotes neighborly accountability, assists in law enforcement processes, and contributes to the creation of a harmonious residential environment.