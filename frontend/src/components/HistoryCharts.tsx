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
  const [metricTab, setMetricTab] = useState<'vpd' | 'temp' | 'hum' | 'light' | 'pressure'>('vpd');

  // Formatage des timestamps sur l'axe X selon la plage sélectionnée
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
            Graphiques d'Historique Multi-Canaux
          </h2>
          <p className="text-xs text-slate-400">Suivi temporel des conditions agronomiques ({data.length} points)</p>
        </div>

        {/* Sélecteur de Métriques */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setMetricTab('vpd')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              metricTab === 'vpd' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            VPD (kPa)
          </button>
          <button
            onClick={() => setMetricTab('temp')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              metricTab === 'temp' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Températures
          </button>
          <button
            onClick={() => setMetricTab('hum')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              metricTab === 'hum' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            Humidité
          </button>
          <button
            onClick={() => setMetricTab('light')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              metricTab === 'light' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            PAR (µmol)
          </button>
        </div>

        {/* Sélecteur de Plage Temporelle */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
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
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString() : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {/* Plage cible agronomique optimale (0.8 à 1.4 kPa) */}
              <ReferenceArea y1={0.8} y2={1.4} fill="#10b981" fillOpacity={0.08} />

              <Area type="monotone" dataKey="vpd0" name="VPD Zone 0 (Racinaire)" stroke="#10b981" fill="url(#gradVpd0)" strokeWidth={2} />
              <Area type="monotone" dataKey="vpd1" name="VPD Zone 1 (Médiane)" stroke="#06b6d4" fill="url(#gradVpd1)" strokeWidth={2} />
              <Area type="monotone" dataKey="vpd2" name="VPD Zone 2 (Canopée)" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          ) : metricTab === 'temp' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString() : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="t0" name="T° AHT Zone 0 (°C)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="t1" name="T° AHT Zone 1 (°C)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="t2" name="T° AHT Zone 2 (°C)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
            </LineChart>
          ) : metricTab === 'hum' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 90]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString() : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="h0" name="Humidité Zone 0 (%)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="h1" name="Humidité Zone 1 (%)" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="h2" name="Humidité Zone 2 (%)" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(v) => (v ? new Date(String(v)).toLocaleString() : '')}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="ppfd4" name="Canal 4 PPFD (µmol)" stroke="#fbbf24" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ppfd5" name="Canal 5 PPFD (µmol)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ppfd6" name="Canal 6 PPFD (µmol)" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ppfd7" name="Canal 7 PPFD (µmol)" stroke="#b45309" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Note d'information sous le graphique */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
        <span>Bande verte : Zone optimale agronomique (0.8 - 1.4 kPa)</span>
        <span className="text-emerald-400/90 font-medium">Échantillonnage en continu (0$ / mois)</span>
      </div>
    </div>
  );
};
