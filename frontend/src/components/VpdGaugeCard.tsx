import React, { useState } from 'react';
import { calculateVPD } from '../utils/agronomy';
import type { VpdResult } from '../utils/agronomy';
import { Activity, Info, Sliders } from 'lucide-react';

interface VpdZoneData {
  zoneIndex: number;
  name: string;
  temp: number;
  humidity: number;
  pressure: number;
}

interface VpdGaugeCardProps {
  zones: VpdZoneData[];
}

export const VpdGaugeCard: React.FC<VpdGaugeCardProps> = ({ zones }) => {
  const [selectedZone, setSelectedZone] = useState<number>(0);
  const [leafOffset, setLeafOffset] = useState<number>(-1.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const activeZone = zones[selectedZone] || zones[0];
  const vpdData: VpdResult = calculateVPD(activeZone.temp, activeZone.humidity, leafOffset);

  // Positionnement sur l'échelle 0.0 kPa à 2.0 kPa (en pourcentage)
  const maxVpdScale = 2.0;
  const needlePercent = Math.min(100, Math.max(0, (vpdData.vpdLeaf / maxVpdScale) * 100));

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Halo lumineux dynamique selon la zone */}
      <div 
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${
          vpdData.zone === 'FLOWERING' ? 'bg-amber-500' :
          vpdData.zone.includes('VEG') ? 'bg-emerald-500' :
          vpdData.zone === 'CLONES' ? 'bg-teal-400' : 'bg-rose-500'
        }`}
      />

      {/* En-tête */}
      <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Confort Climatique & Transpiration (VPD)
            </h2>
            <p className="text-xs text-slate-400">Indicateur de bonne santé et d'absorption des nutriments</p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
            showSettings 
              ? 'bg-slate-800 border-slate-600 text-white' 
              : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Ajuster la température estimée des feuilles"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Écart Feuille ({leafOffset}°C)</span>
        </button>
      </div>

      {/* Sélecteur d'étage de la tour */}
      <div className="flex gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-5 relative z-10">
        {zones.map((z, idx) => (
          <button
            key={z.zoneIndex}
            onClick={() => setSelectedZone(idx)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedZone === idx
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {z.name}
          </button>
        ))}
      </div>

      {/* Réglage du Leaf Offset si activé */}
      {showSettings && (
        <div className="mb-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 relative z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-300 font-medium">Différence estimée (Température feuille - Température air) :</span>
            <span className="font-mono font-bold text-emerald-400">{leafOffset} °C</span>
          </div>
          <input
            type="range"
            min="-3.0"
            max="0.5"
            step="0.1"
            value={leafOffset}
            onChange={(e) => setLeafOffset(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0 text-slate-400" />
            Sous éclairage LED, les feuilles transpirent et sont généralement 1.5°C plus fraîches que l'air ambiant.
          </p>
        </div>
      )}

      {/* Affichage des valeurs Clés */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        {/* VPD Feuille (Principal) */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Indice de Confort (VPD)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vpdData.badgeBg}`}>
              {vpdData.statusLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${vpdData.colorClass}`}>
              {vpdData.vpdLeaf}
            </span>
            <span className="text-sm font-semibold text-slate-400">kPa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {vpdData.advice}
          </p>
        </div>

        {/* Climat ambiant */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
              Climat Ambiant
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-200">{activeZone.temp}°C</span>
              <span className="text-xs font-medium text-slate-400">/ {activeZone.humidity}% hum</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 text-[11px] text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-500">T° Feuilles</span>
              <span className="font-semibold text-slate-300">{(activeZone.temp + leafOffset).toFixed(1)} °C</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Pression</span>
              <span className="font-semibold text-slate-300">{activeZone.pressure} hPa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jauge horizontale avec zones agronomiques */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Humide (0.0 kPa)</span>
          <span className="font-mono text-xs text-white font-bold">{vpdData.vpdLeaf} kPa</span>
          <span>Sec (2.0 kPa)</span>
        </div>

        {/* Barre de progression segmentée */}
        <div className="relative h-4 rounded-full overflow-hidden bg-slate-950 border border-slate-800 flex">
          <div className="h-full bg-sky-500/80 border-r border-slate-900" style={{ width: '20%' }} title="Trop humide (< 0.4)" />
          <div className="h-full bg-teal-400/80 border-r border-slate-900" style={{ width: '20%' }} title="Semis & Jeunes Pousses (0.4 - 0.8)" />
          <div className="h-full bg-emerald-400/90 border-r border-slate-900" style={{ width: '12.5%' }} title="Croissance Végétative (0.8 - 1.05)" />
          <div className="h-full bg-amber-400/90 border-r border-slate-900" style={{ width: '20%' }} title="Floraison Optimale (1.05 - 1.45)" />
          <div className="h-full bg-rose-500/80" style={{ width: '27.5%' }} title="Trop sec (> 1.45)" />

          {/* Curseur de valeur actuelle */}
          <div 
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] rounded-full transition-all duration-700 -translate-x-1/2"
            style={{ left: `${needlePercent}%` }}
          />
        </div>

        {/* Légende des segments */}
        <div className="grid grid-cols-5 text-[9px] font-medium text-center text-slate-400 pt-1">
          <span className="text-sky-400">Humide</span>
          <span className="text-teal-400">Semis</span>
          <span className="text-emerald-400">Croissance</span>
          <span className="text-amber-400">Floraison</span>
          <span className="text-rose-400">Sec</span>
        </div>
      </div>
    </div>
  );
};
