import { useState, useEffect } from 'react';
import { PumpControlCard } from './components/PumpControlCard';
import { LightControlCard } from './components/LightControlCard';
import { SensorsGrid } from './components/SensorsGrid';
import type { ZoneSensorReading } from './components/SensorsGrid';
import { LoginModal } from './components/LoginModal';
import { VpdGaugeCard } from './components/VpdGaugeCard';
import { LightSpectrumCard } from './components/LightSpectrumCard';
import { HistoryCharts } from './components/HistoryCharts';
import { LanguageToggle } from './components/LanguageToggle';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { supabase, isConfigured } from './lib/supabase';
import type { TelemetryPoint } from './lib/supabase';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  LogOut, 
  LogIn, 
  TrendingUp,
  Sliders,
  ShieldCheck,
  Eye,
  Radio
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5013';

// Générateur de faux historique pour le mode showcase en ligne si Supabase n'est pas encore connecté
function generateSeedHistory(): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toISOString();
    const cycle = Math.sin((i / 24) * Math.PI * 2);
    points.push({
      created_at: time,
      device_id: 'esp32-tower-1',
      t0: Number((26.5 + cycle * 1.2).toFixed(1)),
      h0: Number((61.0 - cycle * 3.5).toFixed(1)),
      p0: 1003.5,
      vpd0: Number((1.08 + cycle * 0.15).toFixed(2)),
      t1: Number((26.6 + cycle * 1.3).toFixed(1)),
      h1: Number((63.0 - cycle * 4.0).toFixed(1)),
      p1: 1004.7,
      vpd1: Number((1.02 + cycle * 0.18).toFixed(2)),
      t2: Number((27.0 + cycle * 1.5).toFixed(1)),
      h2: Number((62.5 - cycle * 4.2).toFixed(1)),
      p2: 1002.8,
      vpd2: Number((1.05 + cycle * 0.20).toFixed(2)),
      lux4: Number(Math.max(5, 20.28 + cycle * 8).toFixed(2)),
      ppfd4: Number(Math.max(0.08, (20.28 + cycle * 8) * 0.015).toFixed(2)),
      lux5: Number(Math.max(3, 7.83 + cycle * 4).toFixed(2)),
      ppfd5: Number(Math.max(0.05, (7.83 + cycle * 4) * 0.015).toFixed(2)),
      lux6: Number(Math.max(4, 12.44 + cycle * 5).toFixed(2)),
      ppfd6: Number(Math.max(0.06, (12.44 + cycle * 5) * 0.015).toFixed(2)),
      lux7: Number(Math.max(2, 4.61 + cycle * 2).toFixed(2)),
      ppfd7: Number(Math.max(0.03, (4.61 + cycle * 2) * 0.015).toFixed(2)),
    });
  }
  return points;
}

function MainDashboard() {
  const { language, t } = useTranslation();

  // États d'authentification
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Navigation par Onglets
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'controls' | 'logs'>('live');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // États des capteurs réels (Initialisés avec la trame fournie par l'utilisateur !)
  const [zoneReadings, setZoneReadings] = useState<ZoneSensorReading[]>([
    { channel: 0, label: 'Étage 1 (Zone Basse / Racines)', ahtTemp: 26.8, ahtHum: 60.7, bmpTemp: 27.6, pressure: 1003.5 },
    { channel: 1, label: 'Étage 2 (Zone Médiane)',     ahtTemp: 26.8, ahtHum: 63.1, bmpTemp: 27.7, pressure: 1004.7 },
    { channel: 2, label: 'Étage 3 (Canopée Supérieure)', ahtTemp: 26.8, ahtHum: 62.6, bmpTemp: 27.5, pressure: 1002.8 },
  ]);

  const [lightSensors, setLightSensors] = useState([
    { channel: 4, label: 'Étage 4 (Sommet)', lux: 20.28 },
    { channel: 5, label: 'Étage 3 (Haut)', lux: 7.83 },
    { channel: 6, label: 'Étage 2 (Milieu)', lux: 12.44 },
    { channel: 7, label: 'Étage 1 (Bas)', lux: 4.61 },
  ]);

  // Historique de télémétrie
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>(generateSeedHistory());

  // États de l'UI
  const [connectionState, setConnectionState] = useState<'Connecting' | 'Connected' | 'Live Showcase'>(isConfigured ? 'Connected' : 'Live Showcase');
  const [mqttLogs, setMqttLogs] = useState<{ id: string; time: string; text: string; type: 'sensor' | 'command' | 'sys' }[]>([]);

  // Utilitaire d'ajout de log
  const addLog = (text: string, type: 'sensor' | 'command' | 'sys' = 'sys') => {
    const time = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substring(2, 9);
    setMqttLogs(prev => [{ id, time, text, type }, ...prev.slice(0, 49)]);
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    addLog(language === 'fr' ? "Déconnexion réussie. Mode lecture seule activé." : "Logged out. Read-only mode activated.", "sys");
  };

  // Connexion Admin
  const handleLoginSuccess = (newToken: string, user: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', user);
    setToken(newToken);
    setUsername(user);
    setIsLoginOpen(false);
    addLog(language === 'fr' ? `Connexion réussie (${user}). Accès déverrouillé.` : `Authentication successful (${user}). Unlocked.`, "sys");
  };

  // Initialisation des logs
  useEffect(() => {
    if (language === 'fr') {
      addLog("Système de télémétrie prêt · Capteurs en ligne.", "sys");
      addLog("Étage 1 (Bas) : Température 26.8°C | Humidité 60.7% | Pression 1003.5 hPa", "sensor");
      addLog("Étage 2 (Milieu) : Température 26.8°C | Humidité 63.1% | Pression 1004.7 hPa", "sensor");
      addLog("Étage 3 (Haut) : Température 26.8°C | Humidité 62.6% | Pression 1002.8 hPa", "sensor");
      addLog("Éclairage Étage 4 : 20.3 Lux (0.30 µmol/m²/s PAR)", "sensor");
      addLog("Éclairage Étage 3 : 7.8 Lux (0.12 µmol/m²/s PAR)", "sensor");
      addLog("Éclairage Étage 2 : 12.4 Lux (0.19 µmol/m²/s PAR)", "sensor");
      addLog("Éclairage Étage 1 : 4.6 Lux (0.07 µmol/m²/s PAR)", "sensor");
    } else {
      addLog("Telemetry system online · All sensors connected.", "sys");
      addLog("Tier 1 (Roots) : Temp 26.8°C | Humidity 60.7% | Pressure 1003.5 hPa", "sensor");
      addLog("Tier 2 (Mid)   : Temp 26.8°C | Humidity 63.1% | Pressure 1004.7 hPa", "sensor");
      addLog("Tier 3 (Canopy): Temp 26.8°C | Humidity 62.6% | Pressure 1002.8 hPa", "sensor");
      addLog("Light Tier 4 : 20.3 Lux (0.30 µmol/m²/s PAR)", "sensor");
      addLog("Light Tier 3 : 7.8 Lux (0.12 µmol/m²/s PAR)", "sensor");
      addLog("Light Tier 2 : 12.4 Lux (0.19 µmol/m²/s PAR)", "sensor");
      addLog("Light Tier 1 : 4.6 Lux (0.07 µmol/m²/s PAR)", "sensor");
    }
  }, [language]);

  // Synchronisation Supabase ou Simulation Live
  useEffect(() => {
    if (isConfigured) {
      addLog(language === 'fr' ? "Synchronisation temps réel connectée." : "Realtime sync connected.", "sys");
      const channel = supabase
        .channel('live-telemetry')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sensor_telemetry' },
          (payload) => {
            const row = payload.new as TelemetryPoint;
            setZoneReadings([
              { channel: 0, label: 'Étage 1 (Zone Basse / Racines)', ahtTemp: row.t0, ahtHum: row.h0, bmpTemp: row.t0 + 0.8, pressure: row.p0 },
              { channel: 1, label: 'Étage 2 (Zone Médiane)',     ahtTemp: row.t1, ahtHum: row.h1, bmpTemp: row.t1 + 0.9, pressure: row.p1 },
              { channel: 2, label: 'Étage 3 (Canopée Supérieure)', ahtTemp: row.t2, ahtHum: row.h2, bmpTemp: row.t2 + 0.7, pressure: row.p2 },
            ]);
            setLightSensors([
              { channel: 4, label: 'Étage 4 (Sommet)', lux: row.lux4 },
              { channel: 5, label: 'Étage 3 (Haut)', lux: row.lux5 },
              { channel: 6, label: 'Étage 2 (Milieu)', lux: row.lux6 },
              { channel: 7, label: 'Étage 1 (Bas)', lux: row.lux7 },
            ]);
            setHistoryData(prev => [...prev.slice(1), row]);
            addLog(language === 'fr' 
              ? `Nouvelles mesures reçues : Confort=${row.vpd0} kPa, Lumière sommet=${row.lux4} Lux`
              : `New readings received: VPD=${row.vpd0} kPa, Top Lux=${row.lux4} Lux`, 'sensor');
            setConnectionState('Connected');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Simulation fluide pour la démonstration en ligne
      const interval = setInterval(() => {
        setZoneReadings(prev => prev.map(z => ({
          ...z,
          ahtTemp: Number((z.ahtTemp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          ahtHum: Number((z.ahtHum + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        })));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [language]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* BANNIÈRE SYSTÈME IOT CONVIVIALE */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">
              {language === 'fr' ? 'Supervision en Direct' : 'Live Monitoring'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 hidden sm:inline">
              {language === 'fr' 
                ? 'Tour Horticole Verticale · 3 Niveaux de Culture · 4 Zones Lumineuses' 
                : 'Vertical Horticultural Tower · 3 Growing Levels · 4 Light Zones'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-medium">
                {connectionState === 'Live Showcase' ? t.nav.showcaseBadge : connectionState}
              </span>
            </div>
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              5000K Daylight
            </span>
            {token ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin ({username})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                <Eye className="w-3.5 h-3.5" /> {language === 'fr' ? 'Visiteur' : 'Guest'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Agroroue <span className="text-emerald-400">{t.nav.title}</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">{t.nav.subtitle}</p>
            </div>
          </div>

          {/* Onglets de navigation conviviaux */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {t.nav.tabOverview}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {t.nav.tabHistory}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('controls')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'controls'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.nav.tabControls}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              {t.nav.tabLogs}
            </button>
          </nav>

          {/* Boutons d'Action : Sélecteur de Langue + Login */}
          <div className="flex items-center gap-2.5">
            {/* Toggle Switch Bilingue FR / EN */}
            <LanguageToggle />

            {token ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </button>
            )}
          </div>
        </div>

        {/* Barre d'onglets pour mobiles et petits écrans */}
        <div className="lg:hidden px-4 pb-2.5 pt-1 overflow-x-auto flex items-center gap-1.5 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap ${
              activeTab === 'live' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {t.nav.tabOverview}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap ${
              activeTab === 'history' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {t.nav.tabHistory}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap ${
              activeTab === 'controls' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {t.nav.tabControls}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {t.nav.tabLogs}
          </button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ONGLET 1 : SUPERVISION TEMPS RÉEL & CALCULS AGRONOMIQUES */}
        {activeTab === 'live' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* LIGNE 1 : JAUGE VPD & SPECTRE LUMINEUX PAR/PPFD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VpdGaugeCard 
                zones={zoneReadings.map(z => ({
                  zoneIndex: z.channel,
                  name: z.label,
                  temp: z.ahtTemp,
                  humidity: z.ahtHum,
                  pressure: z.pressure
                }))}
              />
              <LightSpectrumCard sensors={lightSensors} />
            </div>

            {/* LIGNE 2 : LES 3 ÉTAGES DE CULTURE */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  {t.climate.title}
                </h2>
                <span className="text-xs text-slate-500">{t.climate.subtitle}</span>
              </div>
              <SensorsGrid zones={zoneReadings} />
            </div>

          </div>
        )}

        {/* ONGLET 2 : GRAPHIQUES D'HISTORIQUE INTERACTIFS */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <HistoryCharts 
              data={historyData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
        )}

        {/* ONGLET 3 : ACTIONNEURS & ÉQUIPEMENTS (EN DÉVELOPPEMENT) */}
        {activeTab === 'controls' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  {language === 'fr' ? 'Gestion des Équipements & Actionneurs' : 'Equipment & Actuator Management'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'fr' 
                    ? "Statut de l'éclairage horticole Barrina T8 et circuit d'irrigation" 
                    : "Status of Barrina T8 horticultural light fixtures and irrigation circuit"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PumpControlCard isRunning={true} />
              <LightControlCard />
            </div>
          </div>
        )}

        {/* ONGLET 4 : JOURNAL D'ACTIVITÉ */}
        {activeTab === 'logs' && (
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">{t.logs.title}</h3>
              </div>
              <span className="text-xs text-slate-500">{t.logs.subtitle}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto">
              {mqttLogs.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">{t.logs.empty}</div>
              ) : (
                mqttLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 select-none">[{log.time}]</span>
                    <span className={
                      log.type === 'sensor' ? 'text-emerald-400' :
                      log.type === 'command' ? 'text-amber-400 font-semibold' : 'text-sky-300'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE LOGIN ADMIN */}
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          backendUrl={BACKEND_URL}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <MainDashboard />
    </LanguageProvider>
  );
}

export default App;
