import React, { useState } from 'react';
import { calculateVPD } from '../utils/agronomy';
import type { VpdResult } from '../utils/agronomy';
import { Activity, Info, Sliders } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

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

const zoneI18n = {
  fr: {
    DANGER_LOW: { label: 'Trop humide (Danger)', advice: 'Risque très élevé de moisissure (Botrytis), transpiration quasi nulle.' },
    CLONES: { label: 'Semis & Boutures', advice: 'Idéal pour l’enracinement et les jeunes pousses sans stress.' },
    EARLY_VEG: { label: 'Croissance Végétative', advice: 'Parfait pour le développement foliaire et l’absorption d’azote.' },
    LATE_VEG: { label: 'Optimal Végétatif', advice: 'Transpiration équilibrée, stomates ouverts.' },
    FLOWERING: { label: 'Floraison / Fructification', advice: 'Transpiration active, absorption maximale de nutriments minéraux.' },
    DANGER_HIGH: { label: 'Trop sec (Stress Hydrique)', advice: 'Stomates fermés pour éviter le dessèchement, arrêt de croissance.' },
  },
  en: {
    DANGER_LOW: { label: 'Too Humid (Danger)', advice: 'High risk of mold/fungus (Botrytis), transpiration near zero.' },
    CLONES: { label: 'Seedlings & Cuttings', advice: 'Ideal for rooting and young seedlings without moisture stress.' },
    EARLY_VEG: { label: 'Vegetative Growth', advice: 'Optimal for leaf area expansion and active nitrogen uptake.' },
    LATE_VEG: { label: 'Optimal Vegetative', advice: 'Balanced transpiration, open stomata.' },
    FLOWERING: { label: 'Flowering / Fruiting', advice: 'Active transpiration, maximum mineral nutrient absorption.' },
    DANGER_HIGH: { label: 'Too Dry (Water Stress)', advice: 'Stomata closed to avoid dehydration, stalled vegetative growth.' },
  }
};

export const VpdGaugeCard: React.FC<VpdGaugeCardProps> = ({ zones }) => {
  const { language, t } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<number>(0);
  const [leafOffset, setLeafOffset] = useState<number>(-1.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const activeZone = zones[selectedZone] || zones[0];
  const vpdData: VpdResult = calculateVPD(activeZone.temp, activeZone.humidity, leafOffset);

  const translatedZone = zoneI18n[language][vpdData.zone] || {
    label: vpdData.statusLabel,
    advice: vpdData.advice
  };

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
              {t.vpd.title}
            </h2>
            <p className="text-xs text-slate-400">{t.vpd.subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
            showSettings 
              ? 'bg-slate-800 border-slate-600 text-white' 
              : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title={language === 'fr' ? "Ajuster la température estimée des feuilles" : "Adjust estimated leaf temperature offset"}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {language === 'fr' ? `Écart Feuille (${leafOffset}°C)` : `Leaf Offset (${leafOffset}°C)`}
          </span>
        </button>
      </div>

      {/* Sélecteur d'étage de la tour */}
      <div className="flex gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-5 relative z-10">
        {zones.map((z, idx) => (
          <button
            key={z.zoneIndex}
            onClick={() => setSelectedZone(idx)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            <span className="text-slate-300 font-medium">
              {language === 'fr' 
                ? 'Différence estimée (Température feuille - Température air) :' 
                : 'Estimated leaf temperature offset (Leaf Temp - Air Temp):'}
            </span>
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
            {language === 'fr'
              ? "Sous éclairage LED, les feuilles transpirent et sont généralement 1.5°C plus fraîches que l'air ambiant."
              : "Under LED lighting, transpiring leaves are typically 1.5°C cooler than ambient air."}
          </p>
        </div>
      )}

      {/* Affichage des valeurs Clés */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        {/* VPD Feuille (Principal) */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {language === 'fr' ? 'Indice de Confort (VPD)' : 'Comfort Index (VPD)'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vpdData.badgeBg}`}>
              {translatedZone.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${vpdData.colorClass}`}>
              {vpdData.vpdLeaf}
            </span>
            <span className="text-sm font-semibold text-slate-400">kPa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {translatedZone.advice}
          </p>
        </div>

        {/* Climat ambiant */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
              {language === 'fr' ? 'Climat Ambiant' : 'Ambient Climate'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-200">{activeZone.temp}°C</span>
              <span className="text-xs font-medium text-slate-400">
                / {activeZone.humidity}% {language === 'fr' ? 'hum' : 'RH'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 text-[11px] text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-500">
                {language === 'fr' ? 'T° Feuilles' : 'Leaf Temp'}
              </span>
              <span className="font-semibold text-slate-300">{(activeZone.temp + leafOffset).toFixed(1)} °C</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">
                {language === 'fr' ? 'Pression' : 'Pressure'}
              </span>
              <span className="font-semibold text-slate-300">{activeZone.pressure} hPa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jauge horizontale avec zones agronomiques */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{language === 'fr' ? 'Humide (0.0 kPa)' : 'Wet (0.0 kPa)'}</span>
          <span className="font-mono text-xs text-white font-bold">{vpdData.vpdLeaf} kPa</span>
          <span>{language === 'fr' ? 'Sec (2.0 kPa)' : 'Dry (2.0 kPa)'}</span>
        </div>

        {/* Barre de progression segmentée */}
        <div className="relative h-4 rounded-full overflow-hidden bg-slate-950 border border-slate-800 flex">
          <div className="h-full bg-sky-500/80 border-r border-slate-900" style={{ width: '20%' }} />
          <div className="h-full bg-teal-400/80 border-r border-slate-900" style={{ width: '20%' }} />
          <div className="h-full bg-emerald-400/90 border-r border-slate-900" style={{ width: '12.5%' }} />
          <div className="h-full bg-amber-400/90 border-r border-slate-900" style={{ width: '20%' }} />
          <div className="h-full bg-rose-500/80" style={{ width: '27.5%' }} />

          {/* Curseur de valeur actuelle */}
          <div 
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] rounded-full transition-all duration-700 -translate-x-1/2"
            style={{ left: `${needlePercent}%` }}
          />
        </div>

        {/* Légende des segments */}
        <div className="grid grid-cols-5 text-[9px] font-medium text-center text-slate-400 pt-1">
          <span className="text-sky-400">{language === 'fr' ? 'Humide' : 'Wet'}</span>
          <span className="text-teal-400">{language === 'fr' ? 'Semis' : 'Clones'}</span>
          <span className="text-emerald-400">{language === 'fr' ? 'Croissance' : 'Veg'}</span>
          <span className="text-amber-400">{language === 'fr' ? 'Floraison' : 'Flower'}</span>
          <span className="text-rose-400">{language === 'fr' ? 'Sec' : 'Dry'}</span>
        </div>
      </div>
    </div>
  );
};
