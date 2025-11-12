#include <Wire.h>
#include "SSD1306Wire.h"
#include "PubSubClient.h"
#include "WiFi.h"

// KY-037 pins
#define ANALOG_PIN 35  // AO → ADC-capable pin
#define DIGITAL_PIN 19 // DO → digital pin

const char* ssid = "myhotspot";                 
const char* wifi_password = "Hy029817"; 

const char* mqtt_server = "172.20.10.2";  
const char* analog_topic = "analog";
const char* digital_topic = "digital";
const char* mqtt_username = "cloud"; 
const char* mqtt_password = "123"; 
const char* clientID = "esp_1";
const int port = 1883;

// OLED setup
SSD1306Wire display(0x3C, 4, 5); // SDA, SCL

// Store last 3 readings
const int MAX_POINTS = 3;
int analogValues[MAX_POINTS] = {0};
int digitalValues[MAX_POINTS] = {0};

WiFiClient wifiClient;
PubSubClient client(mqtt_server, port, wifiClient); 

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

  if (client.connect(clientID, mqtt_username, mqtt_password)) {
    Serial.println("Connected to MQTT Broker!");
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

  // ✅ WiFi + MQTT only connect once here
  connect_MQTT();
}

void loop() {
  // ✅ Keep MQTT connection alive
  if (!client.connected()) {
    client.connect(clientID, mqtt_username, mqtt_password);
  }
  client.loop();

  Serial.setTimeout(2000);

  int analogValue = analogRead(ANALOG_PIN);
  int digitalValue = digitalRead(DIGITAL_PIN);

  Serial.print("✅ Analog: ");
  Serial.print(analogValue);
  Serial.print("  | ✅ Digital: ");
  Serial.println(digitalValue);

  String a = "A: " + String((int)analogValue);
  String d = "D: " + String((int)digitalValue);

  if (client.publish(analog_topic, String(analogValue).c_str())) {
    Serial.println("Analog sent!");
  } else {
    Serial.println("Analog failed to send. Reconnecting to MQTT Broker and trying again");
    client.connect(clientID, mqtt_username, mqtt_password);
    delay(10);
    client.publish(analog_topic, String(analogValue).c_str());
  }

  if (client.publish(digital_topic, String(d).c_str())) {
    Serial.println("Digital sent!");
  } else {
    Serial.println("Digital failed to send. Reconnecting to MQTT Broker and trying again");
    client.connect(clientID, mqtt_username, mqtt_password);
    delay(10);
    client.publish(digital_topic, String(d).c_str());
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
  delay(300);
}