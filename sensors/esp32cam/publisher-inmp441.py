#include <Wire.h>
#include "SSD1306Wire.h"
#include <ArduinoJson.h>
#include "driver/i2s.h" 

// ----------------------------------------------------
// PIN DEFINITIONS & I2S CONFIG (Updated for ESP32-CAM)
// ----------------------------------------------------
#define I2S_WS 13    // Word Select (L/R) pin
#define I2S_SCK 14   // Serial Clock (BCLK) pin
#define I2S_SD 33    // Serial Data (DOUT) pin

// I2S Configuration Parameters
#define SAMPLE_RATE (44100)
#define BUFFER_SIZE_SAMPLES 1024
const float QUIET_THRESHOLD = 40000.0; // Threshold for digital trigger (magnitude)

// ----------------------------------------------------
// GLOBAL STATE & OBJECTS
// ----------------------------------------------------
// Ensure 0x3C address is correct for your OLED
SSD1306Wire display(0x3C, 4, 5); 

// I2S Buffers
size_t bytes_read = 0;
int32_t i2s_read_buffer[BUFFER_SIZE_SAMPLES];

float rms_value = 0.0; 
int digital_trigger = 0; 

// OLED History 
const int MAX_POINTS = 3;
int analogValues[MAX_POINTS] = {0}; 
int digitalValues[MAX_POINTS] = {0}; 

// ----------------------------------------------------
// I2S FUNCTIONS
// ----------------------------------------------------

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

// ----------------------------------------------------
// SETUP & LOOP
// ----------------------------------------------------

void setup() {
  // Use the primary UART for communication with RPi
  Serial.begin(115200); 

  display.init();
  display.clear();
  display.drawString(0, 0, "I2S Serial Sender"); 
  display.display();

  i2s_install(); 
}

void loop() {
  calculate_rms_and_trigger(); 

  // Format data as a delimited string: RMS_VALUE|DIGITAL_TRIGGER\n
  // Example: 12345.67|0
  Serial.print(rms_value);
  Serial.print("|");
  Serial.println(digital_trigger); 
  
  Serial.flush();

  // Update OLED History
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
  // Adjust delay for sample rate (this is fast, about 100Hz max)
  delay(10); 
}