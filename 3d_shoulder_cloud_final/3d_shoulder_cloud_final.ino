#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <math.h>

Adafruit_MPU6050 mpu1, mpu2;

const int LED_PIN_1 = 5;
const int LED_PIN_2 = 18;
const float SLUMP_THRESHOLD = 20.0;  // Slouch detection threshold in degrees

// ESP32 I2C Pins
#define SDA_PIN 21  
#define SCL_PIN 22  

// WiFi & ThingSpeak Credentials
const char* WIFI_SSID = "motog855G";
const char* WIFI_PASS = "ved12345";
const char* THINGSPEAK_API_KEY = "OEF6YRK0XIK3WNYT";
const char* THINGSPEAK_URL = "http://api.thingspeak.com/update";

float initialXZ1 = 0, initialYZ1 = 0;
float initialXZ2 = 0, initialYZ2 = 0;
bool isCalibrated = false;

void setup() {
    Serial.begin(115200);
    delay(3000);  // Delay to allow sensor to stabilize
    Serial.println("\nInitializing System...");

    pinMode(LED_PIN_1, OUTPUT);
    pinMode(LED_PIN_2, OUTPUT);

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi Connected!");

    Wire.begin(SDA_PIN, SCL_PIN);
    
    if (!mpu1.begin(0x68)) {
        Serial.println("ERROR: MPU6050 Sensor 1 not detected!");
        while (1) delay(1000);
    }
    if (!mpu2.begin(0x69)) {
        Serial.println("ERROR: MPU6050 Sensor 2 not detected!");
        while (1) delay(1000);
    }

    Serial.println("MPU6050 Sensors Initialized!");

    delay(2000);

    // Calibrate initial angles
    sensors_event_t a1, a2;
    mpu1.getAccelerometerSensor()->getEvent(&a1);
    mpu2.getAccelerometerSensor()->getEvent(&a2);

    initialXZ1 = atan2(a1.acceleration.x, a1.acceleration.z) * 180 / PI;
    initialYZ1 = atan2(a1.acceleration.y, a1.acceleration.z) * 180 / PI;
    
    initialXZ2 = atan2(a2.acceleration.x, a2.acceleration.z) * 180 / PI;
    initialYZ2 = atan2(a2.acceleration.y, a2.acceleration.z) * 180 / PI;

    // Debugging: Print initial angles
    Serial.print("Initial Left XZ: "); Serial.println(initialXZ1);
    Serial.print("Initial Left YZ: "); Serial.println(initialYZ1);
    Serial.print("Initial Right XZ: "); Serial.println(initialXZ2);
    Serial.print("Initial Right YZ: "); Serial.println(initialYZ2);

    isCalibrated = true;
    Serial.println("Calibration Complete!");
}

void loop() {
    if (!isCalibrated) return;

    sensors_event_t a1, a2;
    mpu1.getAccelerometerSensor()->getEvent(&a1);
    mpu2.getAccelerometerSensor()->getEvent(&a2);

    float currentXZ1 = atan2(a1.acceleration.x, a1.acceleration.z) * 180 / PI;
    float currentYZ1 = atan2(a1.acceleration.y, a1.acceleration.z) * 180 / PI;
    float currentXZ2 = atan2(a2.acceleration.x, a2.acceleration.z) * 180 / PI;
    float currentYZ2 = atan2(a2.acceleration.y, a2.acceleration.z) * 180 / PI;

    Serial.print("Left Shoulder X-Z Angle: "); Serial.println(currentXZ1);
    Serial.print("Left Shoulder Y-Z Angle: "); Serial.println(currentYZ1);
    Serial.print("Right Shoulder X-Z Angle: "); Serial.println(currentXZ2);
    Serial.print("Right Shoulder Y-Z Angle: "); Serial.println(currentYZ2);

    bool slouch1 = (abs(currentXZ1 - initialXZ1) > SLUMP_THRESHOLD) ||
                   (abs(currentYZ1 - initialYZ1) > SLUMP_THRESHOLD);
    bool slouch2 = (abs(currentXZ2 - initialXZ2) > SLUMP_THRESHOLD) ||
                   (abs(currentYZ2 - initialYZ2) > SLUMP_THRESHOLD);

    digitalWrite(LED_PIN_1, slouch1 ? HIGH : LOW);
    digitalWrite(LED_PIN_2, slouch2 ? HIGH : LOW);

    if (slouch1) Serial.println("WARNING: Left Slouch Detected! LED 1 ON.");
    if (slouch2) Serial.println("WARNING: Right Slouch Detected! LED 2 ON.");

    sendToThingSpeak(slouch1, slouch2);

    Serial.println("----------------------");
    delay(500);
}

void sendToThingSpeak(bool slouch1, bool slouch2) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi Disconnected! Skipping upload.");
        return;
    }

    HTTPClient http;
    String url = String(THINGSPEAK_URL) + "?api_key=" + THINGSPEAK_API_KEY +
                 "&field1=" + String(slouch1) + "&field2=" + String(slouch2);

    Serial.print("Sending Data to ThingSpeak: ");
    Serial.println(url);

    http.begin(url);
    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
        Serial.print("ThingSpeak Response: ");
        Serial.println(httpResponseCode);
    } else {
        Serial.print("Error sending data: ");
        Serial.println(httpResponseCode);
    }
    http.end();
}
