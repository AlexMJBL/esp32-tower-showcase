import React from 'react';
import { Thermometer, Droplets, Gauge, Compass } from 'lucide-react';

export interface ZoneSensorReading {
  channel: number;
  label: string;
  ahtTemp: number;
  ahtHum: number;
  bmpTemp: number;
  pressure: number;
}

interface SensorsGridProps {
  zones: ZoneSensorReading[];
}

export const SensorsGrid: React.FC<SensorsGridProps> = ({ zones }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {zones.map((zone) => {
        // Alerte si la pression est anormalement basse (ex: canal 0 bug 769.6 hPa)
        const isPressureSuspicious = zone.pressure < 900;

        return (
          <div
            key={zone.channel}
            className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
          >
            {/* Header de la zone */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <h3 className="font-bold text-sm text-white">{zone.label}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Canal {zone.channel} (AHT20 + BMP280)
              </span>
            </div>

            {/* Mesures Température & Humidité (AHT20) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Température AHT20 */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>T° AHT20</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">
                    {zone.ahtTemp}
                  </span>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
                <span className="text-[10px] text-slate-500">BMP: {zone.bmpTemp}°C</span>
              </div>

              {/* Humidité AHT20 */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Humidité</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-400 tracking-tight">
                    {zone.ahtHum}
                  </span>
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-500">Air relatif</span>
              </div>
            </div>

            {/* Pression Atmosphérique (BMP280) */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs text-slate-300 font-medium block">Pression Barométrique</span>
                  <span className="text-[10px] text-slate-500">Capteur BMP280</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className={`text-base font-bold ${isPressureSuspicious ? 'text-amber-400' : 'text-slate-200'}`}>
                    {zone.pressure}
                  </span>
                  <span className="text-[11px] text-slate-400">hPa</span>
                </div>
                {isPressureSuspicious && (
                  <span className="text-[9px] text-amber-400 font-medium flex items-center justify-end gap-0.5">
                    <Compass className="w-2.5 h-2.5" /> Étalonnage mmHg ?
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
