#include <WiFi.h> 
#include <HTTPClient.h> 

// --- Configuration --- 
const char* WIFI_SSID = "IEE802.11"; 
const char* WIFI_PASSWORD = "FFrdldl101-1409"; 

// Firebase Firestore Project ID 
const char* PROJECT_ID = "flexi-kiosk"; 
// Firestore API Key (from firebase-config.js) 
// Note: If your rules allow open access, you might not strictly need the key in the URL for some ops, 
// but it's good practice. For REST, we usually append it. 
const char* API_KEY = "AIzaSyAHs-Pjs9ZbF09mr83HKK1C8YAkLErV5d8"; 

// PIR Configuration 
#define PIR_PIN 27 
#define LED_PIN 2 
const unsigned long PRESENCE_TIMEOUT = 15000; // 15 seconds 

// State 
bool ledState = false; 
bool lastSentState = false; // Track what we sent to DB to avoid spamming 
unsigned long lastMotionTime = 0; 

void setup() { 
  Serial.begin(115200); 
  
  // Setup Pins 
  pinMode(PIR_PIN, INPUT); 
  pinMode(LED_PIN, OUTPUT); 
  digitalWrite(LED_PIN, LOW); 

  // Connect to WiFi 
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD); 
  Serial.print("Connecting to WiFi"); 
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  } 
  Serial.println("\nWiFi Connected"); 
  Serial.print("IP Address: "); 
  Serial.println(WiFi.localIP()); 

  // PIR Warmup 
  Serial.println("PIR warming up... please wait 60 seconds"); 
  delay(60000); 
  Serial.println("Ready!"); 
  
  // Initial Sync (Assume OFF) 
  updateDashboard(false); 
} 

void loop() { 
  int motion = digitalRead(PIR_PIN); 
  unsigned long now = millis(); 

  // Logic: 
  // If motion detected, Turn ON immediately. 
  // Keep ON until timeout expires. 

  if (motion == HIGH) { 
    lastMotionTime = now; 
    if (!ledState) { 
      ledState = true; 
      digitalWrite(LED_PIN, HIGH); 
      Serial.println("🚶 Motion detected → LED ON"); 
      updateDashboard(true); 
    } 
  } 

  // Turn OFF if no motion for timeout period 
  if (ledState && (now - lastMotionTime >= PRESENCE_TIMEOUT)) { 
    ledState = false; 
    digitalWrite(LED_PIN, LOW); 
    Serial.println("😴 No motion → LED OFF"); 
    updateDashboard(false); 
  } 
  
  delay(100); // Small delay to prevent CPU hogging 
} 

// Function to send data to Firestore 
void updateDashboard(bool isMotionDetected) { 
  if (WiFi.status() == WL_CONNECTED) { 
    HTTPClient http; 
    
    // Firestore REST API Endpoint for updating the document 
    // We use PATCH to update specific fields 
    String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) + 
                 "/databases/(default)/documents/sensors/pir?updateMask.fieldPaths=motion&key=" + String(API_KEY); 
    
    http.begin(url); 
    http.addHeader("Content-Type", "application/json"); 
    
    // JSON Payload 
    // Structure: { "fields": { "motion": { "booleanValue": true/false } } } 
    String jsonPayload = "{ \"fields\": { \"motion\": { \"booleanValue\": " + String(isMotionDetected ? "true" : "false") + " } } }"; 
    
    int httpResponseCode = http.PATCH(jsonPayload); 
    
    if (httpResponseCode > 0) { 
      String response = http.getString(); 
      Serial.print("Firestore Update: "); 
      Serial.println(httpResponseCode); 
    } else { 
      Serial.print("Error on sending PATCH: "); 
      Serial.println(httpResponseCode); 
      Serial.println(http.errorToString(httpResponseCode)); 
    } 
    
    http.end(); 
  } else { 
    Serial.println("WiFi Disconnected"); 
  } 
}
