# ESP32 Tower Garden - IoT Supervision, Agronomy & Cloud Dashboard ($0/mois)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32_+_TCA9548A-red.svg)](https://espressif.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Plateforme IoT complète et moderne pour superviser et contrôler une **Tower Garden** ou une serre intérieure en temps réel, hébergeable à **0,00 $ / mois**.

Le système intègre la télémétrie physique multi-zones sur bus I2C multiplexé, le calcul agronomique en direct du **Déficit de Pression de Vapeur (VPD)** et du **PAR / PPFD** (étalonné sur le profil spectral d'un panneau LED 42W CRI 98+), des graphiques d'historique avec **Recharts**, et une sécurité granulaire par rôles (Visiteurs en lecture seule vs Admin authentifié).

---

## 🏗️ Architecture Globale & Déploiement Cloud (0.00 $ / mois)

```mermaid
flowchart LR
    subgraph Hardware [Matériel Local]
        ESP32[ESP32 Gateway]
        MUX[TCA9548A I2C Mux]
        S0[Canal 0 : AHT20 + BMP280 #1]
        S1[Canal 1 : AHT20 + BMP280 #2]
        S2[Canal 2 : AHT20 + BMP280 #3]
        L4[Canaux 4-7 : 4x VEML7700 Lux]
        
        S0 & S1 & S2 & L4 --> MUX --> ESP32
    end

    subgraph CloudLayer [Cloud 100% Gratuit à vie]
        Supabase[(Supabase PostgreSQL\n- Télémétrie 500MB\n- Table device_commands\n- RLS Sécurité des rôles)]
        Vercel[Vercel / Cloudflare Pages\n- Frontend React SPA\n- CDN mondial SSL]
    end

    subgraph Clients [Navigateurs Web]
        PublicView[Mode Showcase Visiteur\n- Lecture seule\n- Télémétrie & Graphiques]
        AdminView[Mode Administrateur\n- JWT Bearer\n- Contrôle pompes & éclairage]
    end

    ESP32 -- "HTTPS POST (toutes les 30s)" --> Supabase
    Supabase -- "WebSocket Realtime" --> PublicView & AdminView
    AdminView -- "Ordres signés" --> Supabase
    Vercel -. "Hébergement web gratuit" .-> PublicView & AdminView
```

---

## 🌟 Fonctionnalités Clés

### 🌿 1. Calculs Agronomiques Avancés
* **VPD (Vapor Pressure Deficit) Air & Feuille** :
  * Calculé selon l'équation de saturation de vapeur d'eau d'**Arden Buck** :
    $$SVP(T) = 0.61078 \times \exp\left(\frac{17.27 \times T}{T + 237.3}\right) \quad [\text{kPa}]$$
  * Différenciation $VPD_{\text{air}}$ et $VPD_{\text{leaf}}$ avec curseur interactif de décalage thermique foliaire (par défaut $-1.5^\circ\text{C}$ sous LED).
  * Jauge interactive avec code couleur des 5 zones physiologiques : **Semis/Boutures (0.4-0.8 kPa)**, **Végétatif (0.8-1.05 kPa)**, **Floraison (1.05-1.45 kPa)**, et **Zones de danger (moisissure ou stress)**.
* **Conversion Lux $\rightarrow$ PAR / PPFD ($\mu\text{mol}/(\text{m}^2\cdot\text{s})$)** :
  * Étalonné sur le profil spectral d'un éclairage **Full Spectrum 42W CRI 98+** (pic 450 nm et continu 520-660 nm) :
    $$\mathbf{PPFD} = \text{Lux} \times 0.0150 \quad \left(1\,\mu\text{mol}/(\text{m}^2\cdot\text{s}) \approx 66.7\text{ Lux}\right)$$
  * Calcul automatique du **Daily Light Integral (DLI)** en $\text{mol}/(\text{m}^2\cdot\text{jour})$ pour des photopériodes de 12h, 16h et 18h.

### 📊 2. Graphiques d'Historique Multi-Canaux (Recharts)
* Suivi temporel interactif avec sélection de période (**1h, 6h, 24h, 7 jours**).
* 4 modes de visualisation :
  * **VPD multi-zones** avec bande d'objectif agronomique optimale ombrée.
  * **Températures différentielles** (AHT20 vs BMP280 sur les 3 zones).
  * **Humidité relative**.
  * **Intensité lumineuse PAR / PPFD** sur les 4 étages.

### 🔒 3. Sécurité RBAC & Protection Matérielle
* **Mode Démo Showcase (Visiteurs)** : Accès public en lecture seule aux jauges, graphiques et logs sans risque d'actionnement des pompes ou lumières.
* **Mode Administrateur Authentifié** : Authentification JWT via fenêtre modale, déverrouillant l'accès aux curseurs de commande.
* **Failsafe Matériel (ESP32)** : Watchdog matériel limitant automatiquement le fonctionnement continu des pompes (max 120s) pour prévenir toute inondation même en cas de coupure réseau.

---

## 📁 Structure du Répertoire

```text
├── firmware/
│   └── esp32_sensor_gateway.ino    # Firmware C++ ESP32 (TCA9548A, AHT20, BMP280, VEML, Supabase REST)
├── frontend/                       # Application Web React 19 + TypeScript + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── VpdGaugeCard.tsx       # Jauge VPD avec diagnostic stomatique
│   │   │   ├── LightSpectrumCard.tsx  # Carte PAR / PPFD et DLI (4 canaux VEML)
│   │   │   ├── HistoryCharts.tsx      # Graphiques d'historique interactifs Recharts
│   │   │   ├── SensorsGrid.tsx        # Grille des 3 modules physiques AHT20/BMP280
│   │   │   ├── PumpControlCard.tsx    # Contrôle de cycle d'arrosage
│   │   │   ├── LightControlCard.tsx   # Contrôle photopériode et spectre RGB
│   │   │   └── LoginModal.tsx         # Fenêtre de connexion sécurisée
│   │   ├── lib/
│   │   │   └── supabase.ts            # Client Supabase & abonnements WebSockets
│   │   ├── utils/
│   │   │   └── agronomy.ts            # Moteur mathématique pur VPD, PPFD et DLI
│   │   └── App.tsx                    # Dashboard principal avec navigation par onglets
├── backend/                        # Backend optionnel C# .NET 10 (Hub SignalR & Broker MQTTnet)
└── supabase_schema.sql             # Schéma SQL pour hébergement Cloud gratuit à vie
```

---

## 🚀 Démarrage Rapide

### 1. Lancer le Frontend Web en Local
```bash
cd frontend
npm install
npm run dev
```
* Accès à l'interface : `http://localhost:5173/` (ou `http://localhost:4173/` en mode preview build).
* **Identifiants de démonstration Admin** :
  * Utilisateur : `admin`
  * Mot de passe : `SecureAdminPassword123!` (ou `admin`)

### 2. Déployer la Base de Données Gratuite (Supabase)
1. Créez un projet gratuit sur [Supabase](https://supabase.com) (Tier gratuit 500 Mo).
2. Ouvrez l'éditeur SQL et collez le contenu du fichier `supabase_schema.sql`.
3. Récupérez votre `URL` et clé `Anon` dans **Project Settings $\rightarrow$ API**.
4. Renseignez-les dans `frontend/.env` :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-anon
   ```

### 3. Flasher le Firmware ESP32
1. Ouvrez `firmware/esp32_sensor_gateway.ino` dans l'Arduino IDE.
2. Installez les bibliothèques `Adafruit AHTX0`, `Adafruit BMP280`, `Adafruit VEML7700` et `ArduinoJson`.
3. Renseignez votre SSID Wi-Fi et les clés Supabase dans les constantes au début du fichier.
4. Téléversez sur votre ESP32 relié au multiplexeur TCA9548A.

---

## 📜 Licence
Projet distribué sous licence MIT.
