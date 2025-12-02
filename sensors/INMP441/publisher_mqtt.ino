#include <Wire.h>
#include "SSD1306Wire.h"
#include "PubSubClient.h"
#include "WiFi.h"
#include "time.h"
#include <ArduinoJson.h>
#include "driver/i2s.h" 

#define I2S_WS 25    // Word Select (L/R) pin
#define I2S_SD 27    // Serial Data (DOUT) pin
#define I2S_SCK 26   // Serial Clock (BCLK) pin

// I2S Configuration Parameters
#define SAMPLE_RATE (44100)
#define BUFFER_SIZE_SAMPLES 1024
const float QUIET_THRESHOLD = 40000.0; // Threshold for digital trigger (magnitude)

const char* ssid = "YOUR_WIFI_SSID";                 
const char* wifi_password = "YOUR_WIFI_PASS"; 
const char* mqtt_server = "172.20.10.3";  

const char* IDENTIFIER_TOPIC = "esp1_identifier";
const char* DATA_TOPIC = "esp1_data";
const char* mqtt_username = "cloud"; 
const char* mqtt_password = "123"; 
const char* clientID = "Block 57 unit 801"; 
const int port = 1883;

// NTP Time Configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 8 * 3600; 
const int   daylightOffset_sec = 0;

SSD1306Wire display(0x3C, 4, 5); 

size_t bytes_read = 0;
int32_t i2s_read_buffer[BUFFER_SIZE_SAMPLES];

float rms_value = 0.0; 
int digital_trigger = 0; 

const int MAX_POINTS = 3;
int analogValues[MAX_POINTS] = {0}; 
int digitalValues[MAX_POINTS] = {0}; 

WiFiClient wifiClient;
PubSubClient client(mqtt_server, port, wifiClient);


// New function to get the current Unix timestamp in milliseconds (long long)
long long getUnixTimestampMs() {
  struct timeval tv;
  gettimeofday(&tv, NULL);
  // time_t is seconds, tv_usec is microseconds
  long long ms = (long long)tv.tv_sec * 1000LL + (tv.tv_usec / 1000LL);
  return ms;
}


void i2s_install() {
    const i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, 
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = 0,
        .dma_buf_count = 4,
        .dma_buf_len = BUFFER_SIZE_SAMPLES,
        .use_apll = false
    };

    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = I2S_PIN_NO_CHANGE, 
        .data_in_num = I2S_SD
    };

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
}

void calculate_rms_and_trigger() {
    i2s_read(I2S_NUM_0, (char *)i2s_read_buffer, sizeof(i2s_read_buffer), &bytes_read, portMAX_DELAY);
    
    if (bytes_read == 0) return;

    long long sum_of_squares = 0;
    bool loud_event_detected = false; 
    
    int samples_to_process = bytes_read / sizeof(int32_t); 

    if (samples_to_process == 0) {
        rms_value = 0.0;
        digital_trigger = 0;
        return; 
    }

    int processed_samples = 0;
    for (int i = 0; i < samples_to_process; i += 2) { 
        int sample = i2s_read_buffer[i] >> 8; 
        
        // 1. Calculate Sum of Squares for RMS
        sum_of_squares += (long long)sample * sample; 

        // 2. Digital Trigger Logic: Check magnitude
        if (abs(sample) > QUIET_THRESHOLD) { 
            loud_event_detected = true;
        }
        processed_samples++;
    }

    // RMS Calculation
    if (processed_samples > 0) {
        rms_value = sqrt((float)sum_of_squares / processed_samples);
    } else {
        rms_value = 0.0;
    }
    
    digital_trigger = loud_event_detected ? 1 : 0;
}

void connect_MQTT() {
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP()); 

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("NTP Time Sync Started...");

  // Wait for time to synchronize before proceeding (optional)
  struct tm timeinfo;
  int attempt = 0;
  while (!getLocalTime(&timeinfo) && attempt < 10) {
    Serial.print(".");
    delay(1000);
    attempt++;
  }
  if(attempt < 10) Serial.println("\nTime Synced!");


  if (client.connect(clientID, mqtt_username, mqtt_password)) {
    Serial.println("Connected to MQTT Broker!");
    client.publish(IDENTIFIER_TOPIC, clientID); 
  } else {
    Serial.println("Connection to MQTT Broker failed.");
  }
}

void setup() {
  Serial.begin(115200);
  display.init();
  display.clear();
  display.drawString(0, 0, "INMP441 RMS Display"); 
  display.display();

  i2s_install(); 

  connect_MQTT();
}

void loop() {
  if (!client.connected()) {
    if (client.connect(clientID, mqtt_username, mqtt_password)) {
      client.publish(IDENTIFIER_TOPIC, clientID); 
    }
  }
  client.loop();

  calculate_rms_and_trigger(); 

  // --- GET NUMERIC UNIX TIMESTAMP ---
  long long currentTimestamp = getUnixTimestampMs();

  StaticJsonDocument<200> doc; 
  doc["timestamp"] = currentTimestamp; // NUMERIC UNIX MS
  doc["analog"] = rms_value; // RMS Magnitude
  doc["digital"] = digital_trigger;

  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);
  
  if (client.publish(DATA_TOPIC, jsonBuffer)) {
    Serial.print("Published: ");
    Serial.println(jsonBuffer);
  } else {
    client.connect(clientID, mqtt_username, mqtt_password); 
    delay(10); 
    client.publish(DATA_TOPIC, jsonBuffer); 
  }

  for (int i = MAX_POINTS - 1; i > 0; i--) {
    analogValues[i] = analogValues[i - 1];
    digitalValues[i] = digitalValues[i - 1];
  }

  analogValues[0] = (int)rms_value; 
  digitalValues[0] = digital_trigger;

  display.clear();
  display.drawString(0, 0, "RMS Readings:");
  for (int i = 0; i < MAX_POINTS; i++) {
    int y = 12 + i * 10;
    String line = "RMS:" + String(analogValues[i]) + " D:" + String(digitalValues[i]);
    display.drawString(0, y, line);
  }

  display.display();
  delay(10); 
}