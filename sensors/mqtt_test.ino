#include <Wire.h>
#include "SSD1306Wire.h"
#include "PubSubClient.h"
#include "WiFi.h"
#include "time.h"
#include <ArduinoJson.h>

// KY-037 pins
#define ANALOG_PIN 35  // AO → ADC-capable pin
#define DIGITAL_PIN 19 // DO → digital pin

const char* ssid = "wifi_username";                 
const char* wifi_password = "wifi_pass"; 

const char* mqtt_server = "172.20.10.3";  
const char* IDENTIFIER_TOPIC = "esp1_identifier";
const char* DATA_TOPIC = "esp1_data";
const char* mqtt_username = "cloud"; 
const char* mqtt_password = "123"; 
const char* clientID = "esp_1";
const int port = 1883;

// use NTP to get time
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 8 * 3600;
const int   daylightOffset_sec = 0;

// OLED setup
SSD1306Wire display(0x3C, 4, 5); // SDA, SCL

// Store last 3 readings
const int MAX_POINTS = 3;
int analogValues[MAX_POINTS] = {0};
int digitalValues[MAX_POINTS] = {0};

WiFiClient wifiClient;
PubSubClient client(mqtt_server, port, wifiClient);

String getFormattedTime() {
  struct tm timeinfo;
  
  uint32_t ms = millis() % 1000; 

  if(!getLocalTime(&timeinfo)){
    return "Time Not Synced";
  }
  
  char timeString[64];
  strftime(timeString, 64, "%Y-%m-%d %H:%M:%S", &timeinfo);

  char fullTimeString[70];
  snprintf(fullTimeString, sizeof(fullTimeString), "%s.%03u", timeString, ms);

  return String(fullTimeString);
}

void connect_MQTT() {
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Time synchronization started...");

  if (client.connect(clientID, mqtt_username, mqtt_password)) {
    Serial.println("Connected to MQTT Broker!");
    if (client.publish(IDENTIFIER_TOPIC, clientID)) {
      Serial.print("Sent ClientID: ");
      Serial.println(clientID);
    } else {
      Serial.println("Failed to get ClientID.");
    }
  } else {
    Serial.println("Connection to MQTT Broker failed...");
  }
}

void setup() {
  Serial.begin(115200);

  display.init();
  display.clear();
  display.drawString(0, 0, "KY-037 Sound Display");
  display.display();

  pinMode(ANALOG_PIN, INPUT);
  pinMode(DIGITAL_PIN, INPUT);

  // WiFi + MQTT only connect once here
  connect_MQTT();
}

void loop() {
  // Keep MQTT connection alive
  if (!client.connected()) {
    if (client.connect(clientID, mqtt_username, mqtt_password)) {
      Serial.println("Reconnected!");
      client.publish(IDENTIFIER_TOPIC, clientID); 
    }
  }
  client.loop();

  Serial.setTimeout(2000);

  int analogValue = analogRead(ANALOG_PIN);
  int digitalValue = digitalRead(DIGITAL_PIN);

  String currentTimestamp = getFormattedTime();

  Serial.print("Timestamp: ");
  Serial.print(currentTimestamp);
  Serial.print("  | Analog: ");
  Serial.print(analogValue);
  Serial.print("  | Digital: ");
  Serial.println(digitalValue);

  StaticJsonDocument<200> doc; 

  doc["timestamp"] = currentTimestamp;
  doc["analog"] = analogValue;
  doc["digital"] = digitalValue;

  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);

  if (client.publish(DATA_TOPIC, jsonBuffer)) {
    Serial.print("JSON Payload sent to ");
    Serial.print(DATA_TOPIC);
    Serial.print(": ");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Payload failed to send. Reconnecting to MQTT Broker and trying again");
    client.connect(clientID, mqtt_username, mqtt_password);
    delay(10);
    client.publish(DATA_TOPIC, jsonBuffer);
  }


  for (int i = MAX_POINTS - 1; i > 0; i--) {
    analogValues[i] = analogValues[i - 1];
    digitalValues[i] = digitalValues[i - 1];
  }

  analogValues[0] = analogValue;
  digitalValues[0] = digitalValue;

  display.clear();
  display.drawString(0, 0, "Latest 3 readings:");
  for (int i = 0; i < MAX_POINTS; i++) {
    int y = 12 + i * 10;
    String line = "A:" + String(analogValues[i]) + " D:" + String(digitalValues[i]);
    display.drawString(0, y, line);
  }

  display.display();
  delay(10);
}