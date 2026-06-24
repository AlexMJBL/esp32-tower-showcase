import React from 'react';
import { Thermometer, Droplets, Sun } from 'lucide-react';

interface SensorProps {
  temperature1: number;
  temperature2: number;
  humidityPercent: number;
  lux1: number;
  lux2: number;
  lux3: number;
  lux4: number;
}

export const SensorsGrid: React.FC<SensorProps> = ({
  temperature1,
  temperature2,
  humidityPercent,
  lux1,
  lux2,
  lux3,
  lux4,
}) => {
  // Calculer les lux maximums théoriques pour afficher des barres de progression proportionnelles (ex: max 15000 lux)
  const maxLux = 15000;
  const getLuxPercent = (val: number) => Math.min(100, Math.max(0, (val / maxLux) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* CARD 1 & 2 : TEMPÉRATURES */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Température 1 */}
        <div className="rounded-3xl bg-slate-900/60 p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Température 1 (Air)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-emerald-400">{temperature1}</span>
              <span className="text-lg font-semibold text-slate-400">°C</span>
            </div>
            <p className="text-[11px] text-slate-500">Capteur ambiant zone supérieure</p>
          </div>
          <div className="relative h-20 w-20 flex items-center justify-center">
            {/* Jauge SVG Circulaire */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
              <circle 
                cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="6" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(50, Math.max(0, temperature1)) / 50)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <Thermometer className="absolute h-6 w-6 text-emerald-400" />
          </div>
        </div>

        {/* Température 2 */}
        <div className="rounded-3xl bg-slate-900/60 p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Température 2 (Eau)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-sky-400">{temperature2}</span>
              <span className="text-lg font-semibold text-slate-400">°C</span>
            </div>
            <p className="text-[11px] text-slate-500">Capteur zone racinaire/eau</p>
          </div>
          <div className="relative h-20 w-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
              <circle 
                cx="40" cy="40" r="32" stroke="#0ea5e9" strokeWidth="6" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(50, Math.max(0, temperature2)) / 50)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <Thermometer className="absolute h-6 w-6 text-sky-400" />
          </div>
        </div>

        {/* Humidité ambiante */}
        <div className="sm:col-span-2 rounded-3xl bg-slate-900/60 p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Humidité Ambiante</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-blue-400">{humidityPercent}</span>
              <span className="text-lg font-semibold text-slate-400">%</span>
            </div>
            <p className="text-[11px] text-slate-500">Humidité relative de l'air sous dôme</p>
          </div>
          <div className="relative h-20 w-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
              <circle 
                cx="40" cy="40" r="32" stroke="#3b82f6" strokeWidth="6" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(100, Math.max(0, humidityPercent)) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <Droplets className="absolute h-6 w-6 text-blue-400" />
          </div>
        </div>

      </div>

      {/* CARD 3 : LES 4 CAPTEURS DE LUMINOSITÉ (LUX) */}
      <div className="rounded-3xl bg-slate-900/60 p-5 border border-slate-800 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Capteurs de Lux</span>
          <p className="text-[10px] text-slate-500 mb-4">Luminosité mesurée sur les 4 étages verticaux</p>
          
          <div className="space-y-4">
            {/* Lux 1 - Étage Supérieur */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Ét. 4 (Haut)</span>
                <span className="text-amber-400 font-mono">{lux1} lx</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${getLuxPercent(lux1)}%` }}
                ></div>
              </div>
            </div>

            {/* Lux 2 - Étage Milieu-Haut */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Ét. 3 (Milieu-Haut)</span>
                <span className="text-amber-400 font-mono">{lux2} lx</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${getLuxPercent(lux2)}%` }}
                ></div>
              </div>
            </div>

            {/* Lux 3 - Étage Milieu-Bas */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Ét. 2 (Milieu-Bas)</span>
                <span className="text-amber-400 font-mono">{lux3} lx</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${getLuxPercent(lux3)}%` }}
                ></div>
              </div>
            </div>

            {/* Lux 4 - Étage Bas */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Ét. 1 (Bas)</span>
                <span className="text-amber-400 font-mono">{lux4} lx</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${getLuxPercent(lux4)}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center gap-2 text-[10px] text-slate-500">
          <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
          <span>L'éclairage horticole actif augmente drastiquement les lux.</span>
        </div>
      </div>

    </div>
  );
};
