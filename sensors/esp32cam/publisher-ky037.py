#include <Arduino.h>
#include <sys/time.h> // Required for gettimeofday

// KY-037 Hardware Pins (ESP32-CAM)
#define ANALOG_PIN 12 // ADC2_5 (Works because Wi-Fi is OFF)
#define DIGITAL_PIN 13

// Sensor Configuration
const char* DEVICE_ID = "Block 57 unit 801"; // Used for handshake
const int SAMPLE_DELAY_MS = 10; // 10ms delay = 100Hz sample rate

void setup() {
  Serial.begin(115200);
  pinMode(ANALOG_PIN, INPUT);
  pinMode(DIGITAL_PIN, INPUT);

  // 1. Handshake Message (Sent once on boot)
  // This tells the RPi the device ID and signals the start of the data stream.
  Serial.print("{\"type\": \"handshake\", \"id\": \"");
  Serial.print(DEVICE_ID);
  Serial.println("\"}");
}

void loop() {
  // ----------------------------------------------------
  // 1. GET TIME & READ SENSORS
  // ----------------------------------------------------
  struct timeval tv;
  gettimeofday(&tv, NULL);
  // Calculate total milliseconds since Epoch (large integer/float)
  // NOTE: This absolute time will be wrong (1970s), but its increment is precise.
  unsigned long long unix_millis = (unsigned long long)tv.tv_sec * 1000 + (unsigned long long)tv.tv_usec / 1000;

  int analogValue = analogRead(ANALOG_PIN);
  int digitalValue = digitalRead(DIGITAL_PIN);

  // ----------------------------------------------------
  // 2. SEND JSON DATA OVER SERIAL
  // ----------------------------------------------------
  // Send data using numeric types for the Python receiver's safety.
  Serial.print("{\"type\": \"data\", \"timestamp\": ");
  Serial.print(unix_millis); 
  Serial.print(", \"analog\": ");
  Serial.print(analogValue);
  Serial.print(", \"digital\": ");
  Serial.print(digitalValue);
  Serial.println("}");

  delay(SAMPLE_DELAY_MS); 
}