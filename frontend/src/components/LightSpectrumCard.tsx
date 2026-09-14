import React, { useState } from 'react';
import { calculatePAR, LUX_TO_PPFD_FACTOR } from '../utils/agronomy';
import type { ParResult } from '../utils/agronomy';
import { Sun, Sparkles, Clock, Layers } from 'lucide-react';

interface LightSensorData {
  channel: number;
  label: string;
  lux: number;
}

interface LightSpectrumCardProps {
  sensors: LightSensorData[];
}

export const LightSpectrumCard: React.FC<LightSpectrumCardProps> = ({ sensors }) => {
  const [photoperiod, setPhotoperiod] = useState<12 | 16 | 18>(16);

  // Maximum d'échelle PPFD pour la jauge (ex: 800 µmol/m²/s pour un éclairage de serre)
  const maxScalePpfd = 600;

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Halo lumineux d'ambiance dorée */}
      <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20 bg-amber-500 pointer-events-none" />

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Éclairage PAR / PPFD & DLI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                CRI 98+ (42W)
              </span>
            </div>
            <p className="text-xs text-slate-400">Conversion spectrale VEML7700 (facteur ×{LUX_TO_PPFD_FACTOR})</p>
          </div>
        </div>

        {/* Sélecteur de photopériode pour calcul du DLI */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <span className="text-[11px] text-slate-400 mr-1">Photopériode :</span>
          {([12, 16, 18] as const).map((h) => (
            <button
              key={h}
              onClick={() => setPhotoperiod(h)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                photoperiod === h
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Grille des 4 Capteurs VEML7700 (Canaux 4, 5, 6, 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5 relative z-10">
        {sensors.map((s) => {
          const par: ParResult = calculatePAR(s.lux);
          const currentDli = photoperiod === 12 ? par.dli12h : photoperiod === 16 ? par.dli16h : par.dli18h;
          const barPercent = Math.min(100, Math.max(2, (par.ppfd / maxScalePpfd) * 100));

          return (
            <div 
              key={s.channel} 
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400/70" />
                  <span className="text-xs font-semibold text-slate-300">{s.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Canal {s.channel}</span>
              </div>

              {/* Valeurs principales : PPFD et Lux */}
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-2xl font-black text-amber-400 tracking-tight">
                    {par.ppfd}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 ml-1">µmol/m²/s</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-300 font-semibold">{par.lux}</span>
                  <span className="text-[10px] text-slate-500 ml-1">Lux</span>
                </div>
              </div>

              {/* Jauge d'intensité lumineuse */}
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>DLI ({photoperiod}h) : <strong className="text-slate-200">{currentDli}</strong> mol/m²/j</span>
                  <span className="text-amber-400/80 font-medium">{par.intensityLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note d'explication agronomique en bas */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
        <span>Spectre spécifique calibré : <strong>Pic 450nm (Bleu) + 630-660nm (Rouge)</strong></span>
        <span className="text-amber-400/90 font-mono font-medium">1 µmol/s/m² ≈ 66.7 Lux</span>
      </div>
    </div>
  );
};
