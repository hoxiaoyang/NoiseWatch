#include <Wire.h>
#include "SSD1306Wire.h"

// KY-037 pins
#define ANALOG_PIN 35  // AO → ADC-capable pin
#define DIGITAL_PIN 19 // DO → digital pin

// OLED setup
SSD1306Wire display(0x3C, 4, 5); // SDA, SCL

// Store last 3 readings
const int MAX_POINTS = 3;
int analogValues[MAX_POINTS] = {0};
int digitalValues[MAX_POINTS] = {0};

void setup() {
  Serial.begin(115200);

  // Initialize OLED
  display.init();
  display.clear();
  display.drawString(0, 0, "KY-037 Sound Display");
  display.display();

  // KY-037 pins
  pinMode(ANALOG_PIN, INPUT);
  pinMode(DIGITAL_PIN, INPUT);
}

void loop() {
  // Read sensor
  int analogValue = analogRead(ANALOG_PIN);
  int digitalValue = digitalRead(DIGITAL_PIN);

  // Shift older readings down
  for (int i = MAX_POINTS - 1; i > 0; i--) {
    analogValues[i] = analogValues[i - 1];
    digitalValues[i] = digitalValues[i - 1];
  }

  // Insert latest at the top
  analogValues[0] = analogValue;
  digitalValues[0] = digitalValue;

  // Draw OLED
  display.clear();
  display.drawString(0, 0, "Latest 3 readings:");
  for (int i = 0; i < MAX_POINTS; i++) {
    int y = 12 + i * 10; // 10px spacing
    String line = "A:" + String(analogValues[i]) + " D:" + String(digitalValues[i]);
    display.drawString(0, y, line);
  }

  display.display();
  delay(200);
}
