import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceArea,
} from 'recharts';
import type { TelemetryPoint } from '../lib/supabase';
import { Calendar, TrendingUp, Sun, Droplets, Thermometer, Gauge } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface HistoryChartsProps {
  data: TelemetryPoint[];
  timeRange: '1h' | '6h' | '24h' | '7d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
}

export const HistoryCharts: React.FC<HistoryChartsProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
  const { language, t } = useTranslation();
  const [metricTab, setMetricTab] = useState<'vpd' | 'temp' | 'hum' | 'light'>('vpd');

  // Formatage des timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (timeRange === '7d') {
        return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
      }
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Barre d'outils supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {t.history.title}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'fr' 
              ? `Suivi multi-niveaux (${data.length} mesures)` 
              : `Multi-tier monitoring (${data.length} data points)`}
          </p>
        </div>

        {/* Sélecteur de Métriques Convivial */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetricTab('vpd')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              metricTab === 'vpd' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            {t.history.tabVpd}
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('temp')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              metricTab === 'temp' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            {t.history.tabTemp}
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('hum')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              metricTab === 'hum' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            {t.history.tabHum}
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('light')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              metricTab === 'light' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            {t.history.tabPar}
          </button>
        </div>

        {/* Sélecteur de Plage Temporelle */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              type="button"
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range === '7d' && language === 'fr' ? '7j' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Zone d'affichage des Graphiques Recharts */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metricTab === 'vpd' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVpd0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradVpd1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.2, 2.0]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {/* Plage cible agronomique optimale (0.8 à 1.4 kPa) */}
              <ReferenceArea y1={0.8} y2={1.4} fill="#10b981" fillOpacity={0.08} />

              <Area 
                type="monotone" 
                dataKey="vpd0" 
                name={language === 'fr' ? 'Étage 1 (Bas / Racines)' : 'Tier 1 (Lower / Roots)'} 
                stroke="#10b981" 
                fill="url(#gradVpd0)" 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="vpd1" 
                name={language === 'fr' ? 'Étage 2 (Milieu)' : 'Tier 2 (Mid)'} 
                stroke="#06b6d4" 
                fill="url(#gradVpd1)" 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="vpd2" 
                name={language === 'fr' ? 'Étage 3 (Haut / Canopée)' : 'Tier 3 (Upper Canopy)'} 
                stroke="#f59e0b" 
                fill="transparent" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
              />
            </AreaChart>
          ) : metricTab === 'temp' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="t0" 
                name={language === 'fr' ? 'Étage 1 (Bas)' : 'Tier 1 (Lower)'} 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="t1" 
                name={language === 'fr' ? 'Étage 2 (Milieu)' : 'Tier 2 (Mid)'} 
                stroke="#38bdf8" 
                strokeWidth={2.5} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="t2" 
                name={language === 'fr' ? 'Étage 3 (Haut)' : 'Tier 3 (Upper)'} 
                stroke="#f43f5e" 
                strokeWidth={2.5} 
                dot={false} 
              />
            </LineChart>
          ) : metricTab === 'hum' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 90]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area 
                type="monotone" 
                dataKey="h0" 
                name={language === 'fr' ? 'Humidité Étage 1 (%)' : 'Humidity Tier 1 (%)'} 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="h1" 
                name={language === 'fr' ? 'Humidité Étage 2 (%)' : 'Humidity Tier 2 (%)'} 
                stroke="#60a5fa" 
                fill="#60a5fa" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="h2" 
                name={language === 'fr' ? 'Humidité Étage 3 (%)' : 'Humidity Tier 3 (%)'} 
                stroke="#93c5fd" 
                fill="#93c5fd" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="ppfd4" 
                name={language === 'fr' ? 'Lumière Niveau 4 (µmol)' : 'Light Tier 4 (µmol)'} 
                stroke="#fbbf24" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="ppfd5" 
                name={language === 'fr' ? 'Lumière Niveau 3 (µmol)' : 'Light Tier 3 (µmol)'} 
                stroke="#f59e0b" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="ppfd6" 
                name={language === 'fr' ? 'Lumière Niveau 2 (µmol)' : 'Light Tier 2 (µmol)'} 
                stroke="#d97706" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="ppfd7" 
                name={language === 'fr' ? 'Lumière Niveau 1 (µmol)' : 'Light Tier 1 (µmol)'} 
                stroke="#b45309" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Note d'information sous le graphique */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
        <span>
          {language === 'fr'
            ? 'Zone verte ombrée : Plage agronomique optimale (0.8 - 1.4 kPa)'
            : 'Shaded green area: Optimal agronomic comfort range (0.8 - 1.4 kPa)'}
        </span>
        <span className="text-emerald-400/90 font-medium">
          {language === 'fr' ? 'Télémétrie continue' : 'Continuous telemetry'}
        </span>
      </div>
    </div>
  );
};
