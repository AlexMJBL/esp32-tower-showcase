import { useState, useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { PumpControlCard } from './components/PumpControlCard';
import { LightControlCard } from './components/LightControlCard';
import { SensorsGrid } from './components/SensorsGrid';
import { WaterStatusCard } from './components/WaterStatusCard';
import { LoginModal } from './components/LoginModal';
import { Activity, Wifi, WifiOff, Terminal, Cpu, LogOut, LogIn } from 'lucide-react';

// DTOs structure matching backend
interface PumpDto {
  isActive: boolean;
  openDurationSeconds: number;
  openIntervalMinutes: number;
}

interface LightDto {
  isOn: boolean;
  red: number;
  green: number;
  blue: number;
  startHour: number;
  dailyDurationHours: number;
}

interface SensorReadingDto {
  timestamp: string;
  temperature1: number;
  temperature2: number;
  humidityPercent: number;
  lux1: number;
  lux2: number;
  lux3: number;
  lux4: number;
  floatSwitchState: boolean;
  waterDetector1: boolean;
  waterDetector2: boolean;
  waterDetector3: boolean;
  waterDetector4: boolean;
  isPumpRunning: boolean;
}

const BACKEND_URL = 'http://localhost:5013';

function App() {
  // États d'authentification
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // États de configuration de l'appareil
  const [pump, setPump] = useState<PumpDto>({ isActive: false, openDurationSeconds: 60, openIntervalMinutes: 15 });
  const [light, setLight] = useState<LightDto>({ isOn: false, red: 180, green: 70, blue: 240, startHour: 8, dailyDurationHours: 16 });
  const [sensors, setSensors] = useState<SensorReadingDto | null>(null);
  
  // États de l'UI
  const [connectionState, setConnectionState] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Disconnected');
  const [mqttLogs, setMqttLogs] = useState<{ id: string; time: string; text: string; type: 'sensor' | 'command' | 'sys' }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const connectionRef = useRef<HubConnection | null>(null);

  // Fonction utilitaire pour ajouter un log dans la console virtuelle
  const addLog = (text: string, type: 'sensor' | 'command' | 'sys' = 'sys') => {
    const time = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substr(2, 9);
    setMqttLogs(prev => [{ id, time, text, type }, ...prev.slice(0, 49)]); // Garde les 50 derniers logs
  };

  // Gestion de la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    addLog("Déconnexion de l'utilisateur. Mode lecture seule activé.", "sys");
  };

  // Gestion du succès de la connexion
  const handleLoginSuccess = (newToken: string, user: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', user);
    setToken(newToken);
    setUsername(user);
    setIsLoginOpen(false);
    addLog(`Utilisateur ${user} connecté. Droits de modification activés.`, "sys");
  };

  // 1. Initialisation des états via REST API (Accessible publiquement)
  const fetchInitialState = async (authToken: string | null) => {
    try {
      addLog("Synchronisation initiale avec l'API Web API...", "sys");
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${BACKEND_URL}/api/sensors/state`, { headers });
      
      if (res.status === 401 && authToken) {
        handleLogout();
        return;
      }
      
      if (!res.ok) throw new Error("Impossible de récupérer l'état initial.");
      
      const data = await res.json();
      if (data.pump) setPump(data.pump);
      if (data.light) setLight(data.light);
      if (data.latestReading) {
        setSensors(data.latestReading);
        addLog("Dernières données de capteurs chargées.", "sensor");
      }
      setError(null);
      addLog("Synchronisation initiale réussie.", "sys");
    } catch (err: any) {
      console.error(err);
      setError("Échec de connexion avec le serveur API C#.");
      addLog("Erreur de synchronisation REST.", "sys");
    }
  };

  // 2. Gestion de la connexion SignalR (WebSockets) - Accessible sans token
  useEffect(() => {
    fetchInitialState(token);

    // Construction de la connexion SignalR (Passe le token s'il existe)
    const connection = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/hubs/sensors`, {
        accessTokenFactory: () => token || '',
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Enregistrement des écouteurs d'événements
    connection.on('ReceiveSensorReading', (reading: SensorReadingDto) => {
      setSensors(reading);
      addLog(
        `Capteurs [MQTT] : Temp1=${reading.temperature1}°C, Hum=${reading.humidityPercent}%, Lux1=${reading.lux1} lx, Flotteur=${reading.floatSwitchState ? 'OK' : 'BAS'}`,
        'sensor'
      );
    });

    connection.on('ReceivePumpState', (pumpState: PumpDto) => {
      setPump(pumpState);
      addLog(`Pompe [MQTT Status] : ${pumpState.isActive ? 'MARCHE' : 'ARRÊT'} (Durée: ${pumpState.openDurationSeconds}s, Intervalle: ${pumpState.openIntervalMinutes}m)`, 'command');
    });

    connection.on('ReceiveLightState', (lightState: LightDto) => {
      setLight(lightState);
      addLog(`Éclairage [MQTT Status] : ${lightState.isOn ? 'ALLUMÉ' : 'ÉTEINT'} (RGB: ${lightState.red},${lightState.green},${lightState.blue})`, 'command');
    });

    // Connexion
    const startConnection = async () => {
      try {
        setConnectionState('Connecting');
        await connection.start();
        setConnectionState('Connected');
        setError(null);
        addLog("Flux temps réel WebSocket connecté à l'API.", "sys");
      } catch (err) {
        console.error(err);
        setConnectionState('Disconnected');
        addLog("Échec de connexion au flux temps réel.", "sys");
        
        // Si c'est un rejet d'auth inattendu
        if (err instanceof Error && err.message.includes('401') && token) {
          handleLogout();
        } else {
          setTimeout(startConnection, 5000);
        }
      }
    };

    connection.onclose((err) => {
      setConnectionState('Disconnected');
      addLog("Flux temps réel déconnecté.", "sys");
      if (err?.message.includes('401') && token) {
        handleLogout();
      }
    });

    startConnection();

    return () => {
      connection.stop();
    };
  }, [token]);

  // 3. Événement de modification de la pompe (appel API)
  const handlePumpUpdate = async (isActive: boolean, duration: number, interval: number) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      addLog(`Envoi commande Pompe : Actif=${isActive}, Durée=${duration}s, Int=${interval}m`, 'command');
      const res = await fetch(`${BACKEND_URL}/api/control/pump`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive,
          openDurationSeconds: duration,
          openIntervalMinutes: interval,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        setIsLoginOpen(true);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur de validation");
      }
    } catch (err: any) {
      addLog(`Échec envoi pompe: ${err.message}`, 'sys');
      alert(`Erreur de validation : ${err.message}`);
    }
  };

  // 4. Événement de modification de l'éclairage (appel API)
  const handleLightUpdate = async (isOn: boolean, red: number, green: number, blue: number, startHour: number, duration: number) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      addLog(`Envoi commande Éclairage : On=${isOn}, RGB=(${red},${green},${blue})`, 'command');
      const res = await fetch(`${BACKEND_URL}/api/control/light`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isOn,
          red,
          green,
          blue,
          startHour,
          dailyDurationHours: duration,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        setIsLoginOpen(true);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur de validation");
      }
    } catch (err: any) {
      addLog(`Échec envoi éclairage: ${err.message}`, 'sys');
      alert(`Erreur de validation : ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] bg-radial-gradient text-slate-100 p-4 sm:p-8">
      {/* Container Principal */}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <Cpu className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white m-0">TOWER GARDEN</h1>
              <p className="text-xs text-slate-400">Supervision & Contrôle IoT en temps réel</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            {/* Utilisateur et déconnexion ou bouton de Connexion */}
            {token ? (
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 py-1.5 px-3 rounded-2xl text-xs">
                <span className="text-slate-400">Session:</span>
                <span className="font-bold text-slate-200">{username}</span>
                <button 
                  onClick={handleLogout}
                  className="ml-1 p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-2xl text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <LogIn className="h-4 w-4" /> Se connecter
              </button>
            )}

            {/* Status connexion */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold tracking-wider uppercase border ${
              connectionState === 'Connected' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : connectionState === 'Connecting' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {connectionState === 'Connected' ? (
                <>
                  <Wifi className="h-4 w-4" /> Live connecté
                </>
              ) : connectionState === 'Connecting' ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" /> Liaison...
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" /> Hors-ligne
                </>
              )}
            </div>

            {/* Status MQTT local */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 uppercase">
              Broker MQTT: Sécurisé
            </div>
          </div>
        </header>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 p-4 rounded-2xl text-sm text-red-400 text-center animate-bounce">
            ⚠️ <strong>Erreur de synchronisation :</strong> {error}. Assurez-vous que le backend C# est démarré sur le port 5013.
          </div>
        )}

        {/* SECTION CAPTEURS (T1, T2, Humidité, Lux 1-4) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-300 uppercase tracking-widest text-left">Télémesures instantanées</h2>
          <SensorsGrid
            temperature1={sensors?.temperature1 ?? 0}
            temperature2={sensors?.temperature2 ?? 0}
            humidityPercent={sensors?.humidityPercent ?? 0}
            lux1={sensors?.lux1 ?? 0}
            lux2={sensors?.lux2 ?? 0}
            lux3={sensors?.lux3 ?? 0}
            lux4={sensors?.lux4 ?? 0}
          />
        </section>

        {/* SECTION CONTROLES (POMPE, LUMIERE, RESERVOIR) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* POMPE */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-300 uppercase tracking-widest text-left">Actuateur Arrosage</h2>
            <PumpControlCard
              isActive={pump.isActive}
              isPumpRunning={sensors?.isPumpRunning ?? false}
              openDurationSeconds={pump.openDurationSeconds}
              openIntervalMinutes={pump.openIntervalMinutes}
              onUpdate={handlePumpUpdate}
              readonly={!token}
            />
          </div>

          {/* ECLAIRAGE */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-300 uppercase tracking-widest text-left">Actuateur Spectre LED</h2>
            <LightControlCard
              isOn={light.isOn}
              red={light.red}
              green={light.green}
              blue={light.blue}
              startHour={light.startHour}
              dailyDurationHours={light.dailyDurationHours}
              onUpdate={handleLightUpdate}
              readonly={!token}
            />
          </div>
        </section>

        {/* SECTION RESERVOIR D'EAU & LOGS DE COMMANDE */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Réservoir d'eau */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-300 uppercase tracking-widest text-left">Sécurité hydraulique</h2>
            <WaterStatusCard
              floatSwitchState={sensors?.floatSwitchState ?? true}
              waterDetector1={sensors?.waterDetector1 ?? false}
              waterDetector2={sensors?.waterDetector2 ?? false}
              waterDetector3={sensors?.waterDetector3 ?? false}
              waterDetector4={sensors?.waterDetector4 ?? false}
            />
          </div>

          {/* Console de log MQTT */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-300 uppercase tracking-widest text-left">Moniteur d'événements MQTT</h2>
            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 h-[340px] flex flex-col justify-between overflow-hidden shadow-2xl relative">
              
              {/* Entête console */}
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3 text-xs text-slate-400 font-mono">
                <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                <span>localhost:1883 [console_logs]</span>
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 text-left pr-2">
                {mqttLogs.length === 0 ? (
                  <div className="text-slate-600 italic text-center pt-10">En attente de messages MQTT...</div>
                ) : (
                  mqttLogs.map(log => (
                    <div key={log.id} className="leading-relaxed border-b border-slate-900/40 pb-1 flex gap-2">
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={
                        log.type === 'sensor' 
                          ? 'text-sky-400' 
                          : log.type === 'command' 
                            ? 'text-amber-400 font-semibold' 
                            : 'text-slate-500'
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* RENDER LOGIN MODAL CONDITIONALLY */}
      {isLoginOpen && (
        <LoginModal 
          onLoginSuccess={handleLoginSuccess} 
          onClose={() => setIsLoginOpen(false)} 
          backendUrl={BACKEND_URL} 
        />
      )}
    </div>
  );
}

export default App;
