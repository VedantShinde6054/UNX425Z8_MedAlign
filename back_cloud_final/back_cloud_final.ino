#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <HTTPClient.h>

Adafruit_MPU6050 mpu1, mpu2;  

const int LED_PIN_1 = 5;   
const int LED_PIN_2 = 18;  
const float SLUMP_OFFSET = 7.0; 

// ESP32 I2C Pins
#define SDA_PIN 21  
#define SCL_PIN 22  

// WiFi & ThingSpeak Credentials
const char* WIFI_SSID = "motog855G";      // Replace with your WiFi SSID
const char* WIFI_PASS = "ved12345";  // Replace with your WiFi Password
const char* THINGSPEAK_API_KEY = "OEF6YRK0XIK3WNYT"; // Replace with your ThingSpeak API Key
const char* THINGSPEAK_URL = "http://api.thingspeak.com/update"; 

float initialTilt1 = 0, initialTilt2 = 0;  
bool isCalibrated = false;

void setup() {
    Serial.begin(115200);
    delay(1000);  
    Serial.println("\nInitializing System...");

    pinMode(LED_PIN_1, OUTPUT);
    pinMode(LED_PIN_2, OUTPUT);

    // Start WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: "); Serial.println(WiFi.localIP());

    // Initialize I2C
    Wire.begin(SDA_PIN, SCL_PIN);
    
    // Initialize MPU6050 Sensors
    if (!mpu1.begin(0x68)) {
        Serial.println("ERROR: MPU6050 Sensor 1 not detected!");
        while (1) delay(1000);
    }
    if (!mpu2.begin(0x69)) {
        Serial.println("ERROR: MPU6050 Sensor 2 not detected!");
        while (1) delay(1000);
    }

    Serial.println("MPU6050 Sensors Initialized!");

    // Configure sensors
    mpu1.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu1.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu1.setFilterBandwidth(MPU6050_BAND_21_HZ);

    mpu2.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu2.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu2.setFilterBandwidth(MPU6050_BAND_21_HZ);

    delay(2000);

    // Calibrate tilt angles
    sensors_event_t a1, g1, temp1, a2, g2, temp2;
    
    mpu1.getEvent(&a1, &g1, &temp1);
    initialTilt1 = atan2(a1.acceleration.x, a1.acceleration.z) * 180 / PI;

    mpu2.getEvent(&a2, &g2, &temp2);
    initialTilt2 = atan2(a2.acceleration.x, a2.acceleration.z) * 180 / PI;

    isCalibrated = true;
    Serial.println("Calibration Complete!");
}

void loop() {
    if (!isCalibrated) return;

    sensors_event_t a1, g1, temp1, a2, g2, temp2;
    
    mpu1.getEvent(&a1, &g1, &temp1);
    mpu2.getEvent(&a2, &g2, &temp2);

    float currentTilt1 = atan2(a1.acceleration.x, a1.acceleration.z) * 180 / PI;
    float currentTilt2 = atan2(a2.acceleration.x, a2.acceleration.z) * 180 / PI;

    Serial.print("Sensor 1 Tilt: "); Serial.println(currentTilt1);
    Serial.print("Sensor 2 Tilt: "); Serial.println(currentTilt2);

    float slouchThreshold1 = initialTilt1 + SLUMP_OFFSET;
    float slouchThreshold2 = initialTilt2 + SLUMP_OFFSET;

    bool slouch1 = abs(currentTilt1) > abs(slouchThreshold1);
    bool slouch2 = abs(currentTilt2) > abs(slouchThreshold2);

    digitalWrite(LED_PIN_1, slouch1 ? HIGH : LOW);
    digitalWrite(LED_PIN_2, slouch2 ? HIGH : LOW);

    if (slouch1) Serial.println("WARNING: Slouch Detected! LED 1 ON.");
    if (slouch2) Serial.println("WARNING: Slouch Detected! LED 2 ON.");

    // Send Data to ThingSpeak
    sendToThingSpeak(slouch1, slouch2);

    Serial.println("----------------------");
    delay(500);  // ThingSpeak allows updates every 0.5 sec
}

void sendToThingSpeak(bool slouch1, bool slouch2) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi Disconnected! Skipping upload.");
        return;
    }

    HTTPClient http;
    String url = String(THINGSPEAK_URL) + "?api_key=" + THINGSPEAK_API_KEY +
                 "&field3=" + String(slouch1) + "&field4=" + String(slouch2);
                 

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
