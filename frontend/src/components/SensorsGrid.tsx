import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

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
  const { language, t } = useTranslation();

  const getTranslatedZoneName = (channel: number, fallback: string) => {
    switch (channel) {
      case 0: return t.climate.level1;
      case 1: return t.climate.level2;
      case 2: return t.climate.level3;
      default: return fallback;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {zones.map((zone) => {
        return (
          <div
            key={zone.channel}
            className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
          >
            {/* Header de la zone */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <h3 className="font-bold text-sm text-white">{getTranslatedZoneName(zone.channel, zone.label)}</h3>
              </div>
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {language === 'fr' ? 'Capteurs actifs' : 'Sensors online'}
              </span>
            </div>

            {/* Mesures Température & Humidité */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Température de l'air */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.climate.temp}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">
                    {zone.ahtTemp}
                  </span>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {language === 'fr' ? 'Air ambiant' : 'Ambient air'}
                </span>
              </div>

              {/* Humidité relative */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.climate.humidity}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-400 tracking-tight">
                    {zone.ahtHum}
                  </span>
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {language === 'fr' ? 'Humidité relative' : 'Relative humidity'}
                </span>
              </div>
            </div>

            {/* Pression Atmosphérique */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs text-slate-300 font-medium block">
                    {language === 'fr' ? 'Pression Atmosphérique' : 'Atmospheric Pressure'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {language === 'fr' ? 'Baromètre local' : 'Local barometer'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base font-bold text-slate-200">
                    {zone.pressure}
                  </span>
                  <span className="text-[11px] text-slate-400">hPa</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
