import React, { useState } from 'react';
import { Cable, AlertCircle, X, Terminal } from 'lucide-react';
import { webSerial, type SerialCallbacks } from '../utils/webSerial';
import { useTranslation } from '../i18n/LanguageContext';

interface UsbConnectionButtonProps {
  onZoneData: (channel: number, ahtTemp: number, ahtHum: number, bmpTemp: number, pressure: number) => void;
  onLightData: (channel: number, lux: number) => void;
  onLog: (text: string, type: 'sensor' | 'command' | 'sys') => void;
  onConnectionChange: (isConnected: boolean) => void;
}

export const UsbConnectionButton: React.FC<UsbConnectionButtonProps> = ({
  onZoneData,
  onLightData,
  onLog,
  onConnectionChange,
}) => {
  const { language } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [portLabel, setPortLabel] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);

  const isSupported = webSerial.isSupported();

  const handleConnect = async () => {
    if (!isSupported) {
      setErrorMessage(
        language === 'fr'
          ? "L'accès direct au port USB (Web Serial) nécessite un navigateur comme Google Chrome, Microsoft Edge, Brave ou Opera."
          : "Direct USB port access (Web Serial) requires Google Chrome, Microsoft Edge, Brave, or Opera."
      );
      return;
    }

    const callbacks: SerialCallbacks = {
      onZoneData,
      onLightData,
      onLog,
      onStatusChange: (connected, name) => {
        setIsConnected(connected);
        setPortLabel(name || '');
        onConnectionChange(connected);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    };

    await webSerial.connect(115200, callbacks);
  };

  const handleDisconnect = async () => {
    await webSerial.disconnect({
      onStatusChange: (connected) => {
        setIsConnected(connected);
        onConnectionChange(connected);
      },
      onLog,
    });
  };

  // Injection manuelle de trame d'essai (pour démonstration rapide)
  const injectDemoFrame = () => {
    const rawLines = [
      "[Canal 0] Module AHT+BMP #1 :",
      "   AHT20  | Temp: 27.2 C | Hum: 59.4 %",
      "   BMP280 | Temp: 28.0 C | Pression: 1003.8 hPa",
      "[Canal 1] Module AHT+BMP #2 :",
      "   AHT20  | Temp: 26.9 C | Hum: 62.8 %",
      "   BMP280 | Temp: 27.8 C | Pression: 1004.2 hPa",
      "[Canal 2] Module AHT+BMP #3 :",
      "   AHT20  | Temp: 26.5 C | Hum: 64.1 %",
      "   BMP280 | Temp: 27.3 C | Pression: 1002.5 hPa",
      "[Canal 4] VEML7700 : Lux: 215.4",
      "[Canal 5] VEML7700 : Lux: 180.2",
      "[Canal 6] VEML7700 : Lux: 145.0",
      "[Canal 7] VEML7700 : Lux: 95.8",
    ];

    onLog(language === 'fr' ? "Injection de trame série réelle reçue de l'ESP32..." : "Injecting real ESP32 serial frame...", "sys");
    
    // Parse manuellement via les callbacks
    onZoneData(0, 27.2, 59.4, 28.0, 1003.8);
    onZoneData(1, 26.9, 62.8, 27.8, 1004.2);
    onZoneData(2, 26.5, 64.1, 27.3, 1002.5);
    onLightData(4, 215.4);
    onLightData(5, 180.2);
    onLightData(6, 145.0);
    onLightData(7, 95.8);

    rawLines.forEach((l) => onLog(l, 'sensor'));
    setShowSimModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all cursor-pointer"
            title={language === 'fr' ? "Cliquez pour déconnecter l'ESP32" : "Click to disconnect ESP32"}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Cable className="w-3.5 h-3.5" />
            <span>{portLabel || 'ESP32 (USB)'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-700 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all shadow-sm cursor-pointer"
              title={language === 'fr' ? "Connecter directement l'ESP32 par câble USB" : "Connect ESP32 directly via USB cable"}
            >
              <Cable className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Connecter ESP32 (USB)' : 'Connect ESP32 (USB)'}</span>
            </button>

            {/* Petit bouton d'injection de trame test */}
            <button
              type="button"
              onClick={() => setShowSimModal(true)}
              className="p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title={language === 'fr' ? "Tester / injecter la trame ESP32" : "Test / inject ESP32 serial frame"}
            >
              <Terminal className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Modal d'erreur / instruction navigateur */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">
                {language === 'fr' ? 'Connexion USB Série' : 'USB Serial Connection'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {errorMessage}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                {language === 'fr' ? 'Compris' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'injection rapide de trame pour démo */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowSimModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {language === 'fr' ? 'Test de Trame Capteurs ESP32' : 'Test ESP32 Sensor Frame'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'fr' ? 'Simulez la réception de vos capteurs réels' : 'Simulate incoming readings from physical sensors'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 mb-4 max-h-40 overflow-y-auto space-y-1">
              <div>[Canal 0] AHT20: 27.2°C, 59.4% | BMP280: 28.0°C, 1003.8 hPa</div>
              <div>[Canal 1] AHT20: 26.9°C, 62.8% | BMP280: 27.8°C, 1004.2 hPa</div>
              <div>[Canal 2] AHT20: 26.5°C, 64.1% | BMP280: 27.3°C, 1002.5 hPa</div>
              <div>[Canaux 4,5,6,7] VEML7700 : 215 Lux, 180 Lux, 145 Lux, 95 Lux</div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-xl text-xs"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={injectDemoFrame}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
              >
                {language === 'fr' ? 'Injecter les mesures' : 'Inject Readings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
