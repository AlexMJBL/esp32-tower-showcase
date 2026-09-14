#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_VEML7700.h>

#define TCA_ADDR 0x70

// Vos broches I2C physiques exactes
#define SDA_PIN 18
#define SCL_PIN 19

// Vos identifiants Wi-Fi validés
const char* WIFI_SSID     = "JuiceWrld";
const char* WIFI_PASSWORD = "Tesjulie1992";

// Clés d'accès Supabase Cloud
const char* SUPABASE_URL  = "https://dulwyxrcjskexkbewjcp.supabase.co";
const char* SUPABASE_KEY  = "sb_publishable_7iLfDazDdkRxq_H2tLKgVg_hI2Sa9p_";
const char* DEVICE_ID     = "esp32-tower-1";

// Intervalle d'envoi vers Supabase (toutes les 15 secondes)
const unsigned long TELEMETRY_INTERVAL_MS = 15000;
unsigned long lastTelemetryTime = 0;

// Instances des capteurs
Adafruit_AHTX0   aht;
Adafruit_BMP280   bmp;
Adafruit_VEML7700 veml;

// Mémoire des mesures
float t_aht[3] = {26.8, 26.8, 26.8};
float h_aht[3] = {60.0, 60.0, 60.0};
float t_bmp[3] = {27.0, 27.0, 27.0};
float p_bmp[3] = {1003.0, 1003.0, 1003.0};
float vpd_val[3] = {1.0, 1.0, 1.0};

float lux_val[4] = {0.0, 0.0, 0.0, 0.0};
float ppfd_val[4] = {0.0, 0.0, 0.0, 0.0};

// Sélection du canal sur le TCA9548A
void selectTCAChannel(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(TCA_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(10);
}

// Calcul agronomique du VPD Feuille (Arden Buck)
float calculateVPD(float tempAir, float humPercent, float leafOffset = -1.5) {
  if (humPercent <= 0.0) humPercent = 0.1;
  if (humPercent > 100.0) humPercent = 100.0;

  float svpAir = 0.61078 * exp((17.27 * tempAir) / (tempAir + 237.3));
  float vpa = svpAir * (humPercent / 100.0);

  float tempLeaf = tempAir + leafOffset;
  float svpLeaf = 0.61078 * exp((17.27 * tempLeaf) / (tempLeaf + 237.3));

  float vpd = svpLeaf - vpa;
  return (vpd < 0.0) ? 0.0 : vpd;
}

// Facteur de conversion Lux -> PAR/PPFD (Spectre 5000K Barrina T8 : 1 µmol/s/m² ≈ 66.7 Lux)
float convertLuxToPPFD(float lux) {
  if (lux < 0) lux = 0;
  return lux * 0.0150;
}

// Connexion Wi-Fi simple et directe (avec puissance RF stabilisée pour éviter les chutes de tension)
void connectWiFi() {
  Serial.println();
  Serial.print("Connexion au reseau : ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  // Stabilise la consommation electrique pour eviter les baisses de tension
  WiFi.setTxPower(WIFI_POWER_15dBm);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 40) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("=================================");
    Serial.println("[OK] Connexion Wi-Fi reussie !");
    Serial.print("Adresse IP : ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal RSSI : ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.println("=================================");
  } else {
    Serial.println("=================================");
    Serial.println("[ATTENTION] Echec de connexion Wi-Fi.");
    Serial.println("=================================");
  }
}

// Envoi HTTPS vers Supabase
void sendTelemetryToSupabase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Chiffrement TLS sans validation de certificat lourd

  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/sensor_telemetry";

  http.begin(client, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  char jsonBuf[512];
  snprintf(jsonBuf, sizeof(jsonBuf),
    "{"
      "\"device_id\":\"%s\","
      "\"t0\":%.2f,\"h0\":%.2f,\"p0\":%.2f,\"vpd0\":%.2f,"
      "\"t1\":%.2f,\"h1\":%.2f,\"p1\":%.2f,\"vpd1\":%.2f,"
      "\"t2\":%.2f,\"h2\":%.2f,\"p2\":%.2f,\"vpd2\":%.2f,"
      "\"lux4\":%.2f,\"ppfd4\":%.2f,"
      "\"lux5\":%.2f,\"ppfd5\":%.2f,"
      "\"lux6\":%.2f,\"ppfd6\":%.2f,"
      "\"lux7\":%.2f,\"ppfd7\":%.2f"
    "}",
    DEVICE_ID,
    t_aht[0], h_aht[0], p_bmp[0], vpd_val[0],
    t_aht[1], h_aht[1], p_bmp[1], vpd_val[1],
    t_aht[2], h_aht[2], p_bmp[2], vpd_val[2],
    lux_val[0], ppfd_val[0],
    lux_val[1], ppfd_val[1],
    lux_val[2], ppfd_val[2],
    lux_val[3], ppfd_val[3]
  );

  int httpCode = http.POST((uint8_t*)jsonBuf, strlen(jsonBuf));
  if (httpCode == 200 || httpCode == 201 || httpCode == 204) {
    Serial.println("\n>>> [Supabase] Mesures enregistrées dans le Cloud avec succès !");
  } else {
    Serial.printf("\n[Supabase] Erreur HTTP POST : %d (Vérifiez la table Supabase)\n", httpCode);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n--- INITIALISATION DU SYSTEME ---");

  // 1. WI-FI EN TOUT PREMIER (avant d'alimenter les 7 capteurs pour eviter la chute de tension 3.3V)
  connectWiFi();

  // 2. INITIALISATION I2C ET CAPTEURS
  // Vos broches 18 et 19 avec pull-up
  pinMode(SDA_PIN, INPUT_PULLUP);
  pinMode(SCL_PIN, INPUT_PULLUP);
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(100);

  // Vérification de la présence du multiplexeur
  Wire.beginTransmission(TCA_ADDR);
  if (Wire.endTransmission() != 0) {
    Serial.println("ERREUR : TCA9548A non detecte a l'adresse 0x70 ! Arret.");
    while (1);
  }
  Serial.println("TCA9548A detecte.");

  // Test des canaux 0 a 2 : AHT20 + BMP280
  for (uint8_t ch = 0; ch <= 2; ch++) {
    selectTCAChannel(ch);
    Serial.printf("\n[Canal %d] Test AHT20 + BMP280...\n", ch);

    if (aht.begin()) {
      Serial.printf("  -> AHT20 #%d : OK\n", ch + 1);
    } else {
      Serial.printf("  -> AHT20 #%d : NON DETECTE (0x38)\n", ch + 1);
    }

    if (bmp.begin(0x76) || bmp.begin(0x77)) {
      Serial.printf("  -> BMP280 #%d : OK\n", ch + 1);
    } else {
      Serial.printf("  -> BMP280 #%d : NON DETECTE (0x76 / 0x77)\n", ch + 1);
    }
  }

  // Test des canaux 4 a 7 : VEML7700
  for (uint8_t ch = 4; ch <= 7; ch++) {
    selectTCAChannel(ch);
    Serial.printf("\n[Canal %d] Test VEML...\n", ch);

    if (veml.begin()) {
      Serial.printf("  -> VEML (sur SD%d) : OK\n", ch);
      veml.setGain(VEML7700_GAIN_1);
      veml.setIntegrationTime(VEML7700_IT_100MS);
    } else {
      Serial.printf("  -> VEML (sur SD%d) : NON DETECTE (0x10)\n", ch);
    }
  }

  Serial.println("\n--- FIN DU CHECK MATERIEL, DEBUT DES LECTURES ---\n");
  delay(1000);
}

void loop() {
  Serial.println("=================================================");

  // --- LECTURE DES CANAUX 0 A 2 (AHT20 + BMP280) ---
  for (uint8_t ch = 0; ch <= 2; ch++) {
    selectTCAChannel(ch);

    sensors_event_t humidity, temp;
    bool ahtOk = aht.getEvent(&humidity, &temp);
    
    // Essai de lecture BMP280
    bool bmpOk = bmp.begin(0x76) || bmp.begin(0x77);

    Serial.printf("[Canal %d] Module AHT+BMP #%d :\n", ch, ch + 1);

    if (ahtOk) {
      t_aht[ch] = temp.temperature;
      h_aht[ch] = humidity.relative_humidity;
      Serial.printf("   AHT20  | Temp: %.1f C | Hum: %.1f %%\n", temp.temperature, humidity.relative_humidity);
    } else {
      Serial.println("   AHT20  | Erreur de lecture");
    }

    if (bmpOk) {
      t_bmp[ch] = bmp.readTemperature();
      float rawP = bmp.readPressure() / 100.0F;
      if (rawP < 850.0 && rawP > 600.0) rawP *= 1.33322;
      p_bmp[ch] = rawP;
      Serial.printf("   BMP280 | Temp: %.1f C | Pression: %.1f hPa\n", t_bmp[ch], p_bmp[ch]);
    } else {
      Serial.println("   BMP280 | Erreur de lecture");
    }

    vpd_val[ch] = calculateVPD(t_aht[ch], h_aht[ch], -1.5);
  }

  // --- LECTURE DES CANAUX 4 A 7 (VEML) ---
  for (uint8_t ch = 4; ch <= 7; ch++) {
    selectTCAChannel(ch);

    Serial.printf("[Canal %d] VEML :\n", ch);
    if (veml.begin()) {
      veml.setGain(VEML7700_GAIN_1);
      veml.setIntegrationTime(VEML7700_IT_100MS);
      float lux = veml.readLux();
      uint8_t idx = ch - 4;
      lux_val[idx] = (isnan(lux) || lux < 0) ? 0.0 : lux;
      ppfd_val[idx] = convertLuxToPPFD(lux_val[idx]);
      Serial.printf("   Luminosite: %.2f Lux\n", lux_val[idx]);
    } else {
      Serial.println("   Erreur de lecture");
    }
  }

  Serial.println("=================================================\n");

  // Reconnexion Wi-Fi automatique si perte de signal
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWiFiRetry = 0;
    if (millis() - lastWiFiRetry > 25000) {
      lastWiFiRetry = millis();
      Serial.println("[Wi-Fi] Non connecté. Nouvelle tentative de reconnexion...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }

  // Envoi périodique vers Supabase Cloud
  unsigned long now = millis();
  if (WiFi.status() == WL_CONNECTED && now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;
    sendTelemetryToSupabase();
  }

  delay(3000); // Pause de 3 secondes entre chaque cycle
}
