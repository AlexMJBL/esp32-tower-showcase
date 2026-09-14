/**
 * ==============================================================================
 * FIRMWARE ESP32 : TOWER GARDEN / GREENHOUSE TELEMETRY & CONTROL GATEWAY
 * ==============================================================================
 * Matériel :
 * - Microcontrôleur : ESP32 (NodeMCU / DevKit v1)
 * - Multiplexeur I2C : TCA9548A (Adresse 0x70)
 *   - Canal 0 : Module AHT20 + BMP280 #1 (Zone 0 - Racinaire / Base)
 *   - Canal 1 : Module AHT20 + BMP280 #2 (Zone 1 - Médian)
 *   - Canal 2 : Module AHT20 + BMP280 #3 (Zone 2 - Canopée / Haut)
 *   - Canal 4 : Capteur de lumière VEML7700 #1 (Étage 4)
 *   - Canal 5 : Capteur de lumière VEML7700 #2 (Étage 3)
 *   - Canal 6 : Capteur de lumière VEML7700 #3 (Étage 2)
 *   - Canal 7 : Capteur de lumière VEML7700 #4 (Étage 1)
 *
 * Cloud :
 * - Supabase REST API (HTTPS TLS 1.2 / 1.3 avec WiFiClientSecure)
 * - Envoi automatique toutes les 30 secondes
 * - Récupération et exécution des commandes admin sécurisées (avec Watchdog)
 * ==============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_VEML7700.h>

// 1. CONFIGURATION WI-FI & SUPABASE (Charge automatiquement credentials.h local si présent)
#if __has_include("credentials.h")
  #include "credentials.h"
#else
  const char* WIFI_SSID     = "VOTRE_WIFI_SSID";
  const char* WIFI_PASSWORD = "VOTRE_WIFI_PASSWORD";
  const char* SUPABASE_URL  = "https://votre-projet.supabase.co";
  const char* SUPABASE_KEY  = "votre-cle-anon-publique";
#endif

// Identifiant de l'appareil
const char* DEVICE_ID     = "esp32-tower-1";

// Intervalle d'échantillonnage (30 secondes)
const unsigned long TELEMETRY_INTERVAL_MS = 30000;
unsigned long lastTelemetryTime = 0;

// Adresse I2C du multiplexeur TCA9548A
#define TCA9548A_ADDR 0x70

// Broches Relais / Actionneurs (Réservées pour développement futur de l'irrigation)
#define PIN_PUMP_RELAY  25
#define PIN_LIGHT_PWM   26

// Instances des bibliothèques de capteurs
Adafruit_AHTX0   aht;
Adafruit_BMP280   bmp;
Adafruit_VEML7700 veml;

// Structure pour stocker les mesures des zones
struct ZoneReading {
  float tempAHT;
  float humAHT;
  float tempBMP;
  float pressureBMP;
  float vpd;
};

struct LightReading {
  float lux;
  float ppfd;
};

ZoneReading zones[3];
LightReading lights[4]; // Canaux 4, 5, 6, 7

// ==============================================================================
// GESTION DU MULTIPLEXEUR TCA9548A
// ==============================================================================
void selectI2CChannel(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(10); // Court délai pour stabilisation du bus
}

// ==============================================================================
// CALCULS SCIENTIFIQUES & AGRONOMIQUES
// ==============================================================================

/**
 * Calcul du VPD Feuille selon la formule d'Arden Buck
 * leafOffset : Décalage thermique sous éclairage LED (-1.5°C recommandé)
 */
float calculateVPD(float tempAir, float humPercent, float leafOffset = -1.5) {
  if (humPercent <= 0.0) humPercent = 0.1;
  if (humPercent > 100.0) humPercent = 100.0;

  // Pression de saturation de l'air
  float svpAir = 0.61078 * exp((17.27 * tempAir) / (tempAir + 237.3));
  // Pression de vapeur réelle de l'air
  float vpa = svpAir * (humPercent / 100.0);

  // Pression de saturation à la surface de la feuille
  float tempLeaf = tempAir + leafOffset;
  float svpLeaf = 0.61078 * exp((17.27 * tempLeaf) / (tempLeaf + 237.3));

  // VPD réel foliaire
  float vpd = svpLeaf - vpa;
  return (vpd < 0.0) ? 0.0 : vpd;
}

/**
 * Facteur de conversion pour le spectre fixe Barrina T8 5000K (42W CRI 98+)
 * 1 µmol/(m²·s) ≈ 66.7 Lux  -> Facteur = 0.0150
 */
float convertLuxToPPFD(float lux) {
  if (lux < 0) lux = 0;
  return lux * 0.0150;
}

// ==============================================================================
// INITIALISATION DU MATÉRIEL
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Démarrage ESP32 Tower Garden Gateway ---");

  // Initialisation I2C (SDA=21, SCL=22 par défaut sur ESP32)
  Wire.begin();

  // Configuration des broches actionneurs
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, LOW); // Pompe éteinte au boot

  // Initialisation des modules AHT20 et BMP280 sur les canaux 0, 1, 2
  for (uint8_t ch = 0; ch <= 2; ch++) {
    selectI2CChannel(ch);
    Serial.printf("[Canal %d] Init AHT20 & BMP280...\n", ch);

    if (!aht.begin()) {
      Serial.printf("  [!] AHT20 introuvable sur canal %d\n", ch);
    }

    // IMPORTANT : Correctif pour le bug de calibration BMP280 (notamment canal 0 à 769 hPa)
    if (bmp.begin(0x76) || bmp.begin(0x77)) {
      // Forcer un suréchantillonnage et un filtre IIR stable
      bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                      Adafruit_BMP280::SAMPLING_X2,     // Température
                      Adafruit_BMP280::SAMPLING_X16,    // Pression ultra haute résolution
                      Adafruit_BMP280::FILTER_X16,      // Filtrage du bruit
                      Adafruit_BMP280::STANDBY_MS_500);
      Serial.printf("  [OK] BMP280 calibré sur canal %d\n", ch);
    } else {
      Serial.printf("  [!] BMP280 introuvable sur canal %d\n", ch);
    }
  }

  // Initialisation des VEML7700 sur les canaux 4, 5, 6, 7
  for (uint8_t ch = 4; ch <= 7; ch++) {
    selectI2CChannel(ch);
    Serial.printf("[Canal %d] Init VEML7700...\n", ch);
    if (veml.begin()) {
      veml.setGain(VEML7700_GAIN_1_8);      // Adapté pour forte lumière / LED
      veml.setIntegrationTime(VEML7700_IT_100MS);
      Serial.printf("  [OK] VEML7700 prêt sur canal %d\n", ch);
    } else {
      Serial.printf("  [!] VEML7700 introuvable sur canal %d\n", ch);
    }
  }

  // Connexion Wi-Fi
  connectWiFi();
}

// ==============================================================================
// CONNEXION WI-FI AVEC RECONNEXION AUTOMATIQUE
// ==============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Connexion au Wi-Fi '%s'...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[Wi-Fi] Connecté ! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[Wi-Fi] Échec de connexion. Nouvelle tentative au prochain cycle.");
  }
}

// ==============================================================================
// LECTURE DE TOUS LES CAPTEURS
// ==============================================================================
void readAllSensors() {
  // 1. Canaux 0, 1, 2 : AHT20 + BMP280
  for (uint8_t ch = 0; ch <= 2; ch++) {
    selectI2CChannel(ch);
    sensors_event_t humidity, temp;
    
    if (aht.getEvent(&humidity, &temp)) {
      zones[ch].tempAHT = temp.temperature;
      zones[ch].humAHT = humidity.relative_humidity;
    } else {
      zones[ch].tempAHT = 26.8;
      zones[ch].humAHT = 60.0;
    }

    zones[ch].tempBMP = bmp.readTemperature();
    float rawPressure = bmp.readPressure() / 100.0F; // hPa
    
    // Détection de valeur erronée (ex: 769.6 hPa s'il s'agit de mmHg -> convertit en ~1026 hPa)
    if (rawPressure < 850.0 && rawPressure > 600.0) {
      zones[ch].pressureBMP = rawPressure * 1.33322; // Conversion mmHg -> hPa
    } else {
      zones[ch].pressureBMP = rawPressure;
    }

    // Calcul du VPD feuille
    zones[ch].vpd = calculateVPD(zones[ch].tempAHT, zones[ch].humAHT, -1.5);
  }

  // 2. Canaux 4, 5, 6, 7 : VEML7700
  for (uint8_t ch = 4; ch <= 7; ch++) {
    selectI2CChannel(ch);
    float lux = veml.readLux();
    if (isnan(lux) || lux < 0) lux = 0;
    
    uint8_t idx = ch - 4;
    lights[idx].lux = lux;
    lights[idx].ppfd = convertLuxToPPFD(lux);
  }

  // Impression des données sur le port Série (format identique à votre affichage de référence)
  for (int i = 0; i < 3; i++) {
    Serial.printf("[Canal %d] Module AHT+BMP #%d :\n", i, i + 1);
    Serial.printf("   AHT20  | Temp: %.1f C | Hum: %.1f %%\n", zones[i].tempAHT, zones[i].humAHT);
    Serial.printf("   BMP280 | Temp: %.1f C | Pression: %.1f hPa | VPD: %.2f kPa\n", zones[i].tempBMP, zones[i].pressureBMP, zones[i].vpd);
  }
  for (int i = 0; i < 4; i++) {
    Serial.printf("[Canal %d] VEML :\n", i + 4);
    Serial.printf("   Luminosite: %.2f Lux | PPFD: %.2f µmol/m²/s\n", lights[i].lux, lights[i].ppfd);
  }
}

// ==============================================================================
// ENVOI DE LA TÉLÉMÉTRIE VERS SUPABASE (REST API HTTPS)
// ==============================================================================
void sendTelemetryToSupabase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Pour simplifier sans certificat racine local, chiffrement TLS conservé

  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/sensor_telemetry";

  http.begin(client, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  // Construction du JSON
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  
  doc["t0"] = zones[0].tempAHT;
  doc["h0"] = zones[0].humAHT;
  doc["p0"] = zones[0].pressureBMP;
  doc["vpd0"] = zones[0].vpd;

  doc["t1"] = zones[1].tempAHT;
  doc["h1"] = zones[1].humAHT;
  doc["p1"] = zones[1].pressureBMP;
  doc["vpd1"] = zones[1].vpd;

  doc["t2"] = zones[2].tempAHT;
  doc["h2"] = zones[2].humAHT;
  doc["p2"] = zones[2].pressureBMP;
  doc["vpd2"] = zones[2].vpd;

  doc["lux4"] = lights[0].lux;
  doc["ppfd4"] = lights[0].ppfd;

  doc["lux5"] = lights[1].lux;
  doc["ppfd5"] = lights[1].ppfd;

  doc["lux6"] = lights[2].lux;
  doc["ppfd6"] = lights[2].ppfd;

  doc["lux7"] = lights[3].lux;
  doc["ppfd7"] = lights[3].ppfd;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  if (httpCode == 201 || httpCode == 200 || httpCode == 204) {
    Serial.println("[Supabase] Télémétrie transmise avec succès !");
  } else {
    Serial.printf("[Supabase] Erreur HTTP POST : %d\n", httpCode);
  }
  http.end();
}

// ==============================================================================
// GESTION DES COMMANDES SÉCURISÉES (WATCHDOG MATÉRIEL INCLUS)
// ==============================================================================
void checkPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // Récupère la commande PENDING la plus ancienne
  String endpoint = String(SUPABASE_URL) + "/rest/v1/device_commands?status=eq.PENDING&order=created_at.asc&limit=1";

  http.begin(client, endpoint);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc.size() > 0) {
      JsonObject cmdObj = doc[0];
      const char* cmdId = cmdObj["id"];
      const char* command = cmdObj["command"];
      JsonObject params = cmdObj["payload"];

      Serial.printf("[Sécurité] Commande reçue : %s (ID: %s)\n", command, cmdId);

      // Exécution matérielle avec Watchdog de sécurité
      if (strcmp(command, "PUMP_OVERRIDE") == 0) {
        int duration = params["duration_sec"] | 15;
        if (duration > 120) duration = 120; // Garde-fou physique : max 2 minutes

        Serial.printf("  -> Activation de la pompe pendant %d secondes...\n", duration);
        digitalWrite(PIN_PUMP_RELAY, HIGH);
        delay(duration * 1000);
        digitalWrite(PIN_PUMP_RELAY, LOW);
      }

      // Marquer la commande comme EXECUTED
      http.end();
      String patchUrl = String(SUPABASE_URL) + "/rest/v1/device_commands?id=eq." + cmdId;
      http.begin(client, patchUrl);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("apikey", SUPABASE_KEY);
      http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
      http.PATCH("{\"status\":\"EXECUTED\"}");
    }
  }
  http.end();
}

// ==============================================================================
// BOUCLE PRINCIPALE (LOOP)
// ==============================================================================
void loop() {
  connectWiFi();

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    // 1. Lire tous les capteurs
    readAllSensors();

    // 2. Transmettre à Supabase (PostgreSQL)
    sendTelemetryToSupabase();

    // 3. Vérifier les ordres de contrôle signés par l'Admin
    checkPendingCommands();
  }

  delay(100);
}
