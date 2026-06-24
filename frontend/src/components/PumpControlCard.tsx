import React, { useState, useEffect } from 'react';
import { Droplet, Play, Square, RefreshCw, Clock, Lock } from 'lucide-react';

interface PumpProps {
  isActive: boolean;
  isPumpRunning?: boolean;
  openDurationSeconds: number;
  openIntervalMinutes: number;
  onUpdate: (isActive: boolean, duration: number, interval: number) => void;
  readonly?: boolean;
}

export const PumpControlCard: React.FC<PumpProps> = ({
  isActive,
  isPumpRunning = false,
  openDurationSeconds,
  openIntervalMinutes,
  onUpdate,
  readonly = false,
}) => {
  // États locaux pour le contrôle réactif de l'UI avant soumission
  const [duration, setDuration] = useState(openDurationSeconds);
  const [interval, setIntervalVal] = useState(openIntervalMinutes);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronisation avec les props reçues en temps réel via MQTT/SignalR
  useEffect(() => {
    setDuration(openDurationSeconds);
  }, [openDurationSeconds]);

  useEffect(() => {
    setIntervalVal(openIntervalMinutes);
  }, [openIntervalMinutes]);

  const handleToggle = () => {
    if (readonly) return;
    onUpdate(!isActive, duration, interval);
  };

  const handleApplySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readonly) return;
    setIsSaving(true);
    try {
      await onUpdate(isActive, duration, interval);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
      readonly ? 'border-slate-800/80 opacity-90' : 'border-slate-800 hover:border-emerald-500/30'
    }`}>
      {/* Fond décoratif à effet gradient */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${
        isActive 
          ? isPumpRunning 
            ? 'bg-emerald-500/20 animate-pulse' 
            : 'bg-amber-500/10' 
          : 'bg-slate-500/5'
      }`}></div>
      
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl transition-all duration-300 ${
            isActive 
              ? isPumpRunning 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-amber-500/10 text-amber-400' 
              : 'bg-slate-800/80 text-slate-400'
          }`}>
            <Droplet className={`h-6 w-6 ${isPumpRunning ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-slate-100">Système de Pompe</h3>
              {readonly && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 text-slate-500 border border-slate-800/60 rounded-full text-[9px] uppercase font-bold tracking-wider">
                  <Lock className="h-2.5 w-2.5" /> Lecture seule
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 text-left">Arrosage automatique & manuel</p>
          </div>
        </div>

        {/* Bouton d'alimentation */}
        <button
          onClick={handleToggle}
          disabled={readonly}
          className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all duration-300 focus:outline-none ${
            readonly ? 'bg-slate-900 border border-slate-850 cursor-not-allowed text-slate-700' :
            isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 cursor-pointer' : 'bg-slate-800 cursor-pointer'
          }`}
        >
          <span className="sr-only">Toggle Pump</span>
          <span
            className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-300 ${
              isActive ? 'translate-x-10' : 'translate-x-2'
            } flex items-center justify-center`}
          >
            {isActive ? (
              <Square className={`h-3.5 w-3.5 ${readonly ? 'text-slate-400 fill-slate-400' : 'text-emerald-600 fill-emerald-600'}`} />
            ) : (
              <Play className={`h-3.5 w-3.5 ${readonly ? 'text-slate-400 fill-slate-400' : 'text-slate-600 fill-slate-600'}`} />
            )}
          </span>
        </button>
      </div>

      {/* Visualisation de l'état */}
      <div className="mb-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">État Actuel</span>
        <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${
          isActive 
            ? isPumpRunning 
              ? 'text-emerald-400' 
              : 'text-amber-400 animate-pulse' 
            : 'text-slate-500'
        }`}>
          {isActive 
            ? isPumpRunning 
              ? 'POMPE EN MARCHE (ARROSAGE)' 
              : 'CYCLE PLANIFIÉ (EN PAUSE)' 
            : 'IRRIGATION DÉSACTIVÉE'}
        </span>
        
        {/* Animation d'arrosage SVG */}
        <div className="h-16 w-full mt-4 flex items-center justify-center">
          <svg className="w-48 h-12" viewBox="0 0 200 50">
            {/* Tube principal */}
            <path d="M 10,25 Q 100,25 190,25" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            {/* Flux d'eau animé */}
            {isPumpRunning && (
              <path
                d="M 10,25 Q 100,25 190,25"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-water-flow"
              />
            )}
            {/* Ligne pointillée si en pause planifiée */}
            {isActive && !isPumpRunning && (
              <path
                d="M 10,25 Q 100,25 190,25"
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                strokeDasharray="4,4"
                strokeLinecap="round"
                className="opacity-40"
              />
            )}
            {/* Gouttes simulées */}
            {isPumpRunning && (
              <>
                <circle cx="50" cy="35" r="2" className="fill-emerald-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <circle cx="90" cy="38" r="2" className="fill-emerald-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                <circle cx="130" cy="35" r="2" className="fill-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <circle cx="170" cy="39" r="2" className="fill-emerald-400 animate-bounce" style={{ animationDelay: '0.6s' }} />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Paramètres de planification */}
      <form onSubmit={handleApplySettings} className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              Durée d'arrosage
            </label>
            <span className="text-emerald-400 font-semibold">{duration} secondes</span>
          </div>
          <input
            type="range"
            min="5"
            max="300"
            step="5"
            value={duration}
            disabled={readonly}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
              readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-emerald-500'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5 sec</span>
            <span>5 min</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-slate-300 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-slate-400" />
              Intervalle entre cycles
            </label>
            <span className="text-emerald-400 font-semibold">{interval} minutes</span>
          </div>
          <input
            type="range"
            min="1"
            max="120"
            step="1"
            value={interval}
            disabled={readonly}
            onChange={(e) => setIntervalVal(Number(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
              readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-emerald-500'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 min</span>
            <span>2 heures</span>
          </div>
        </div>

        {/* Bouton de sauvegarde des paramètres */}
        <button
          type="submit"
          disabled={readonly || isSaving || (openDurationSeconds === duration && openIntervalMinutes === interval)}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 border ${
            readonly ? 'bg-slate-950/20 text-slate-600 border-slate-900/60 cursor-not-allowed' :
            isSaving ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            (openDurationSeconds === duration && openIntervalMinutes === interval) ? 'bg-slate-800 text-slate-600 border-transparent cursor-default' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white cursor-pointer'
          }`}
        >
          {readonly ? 'Connexion requise pour modifier' : isSaving ? 'Application...' : 'Enregistrer la planification'}
        </button>
      </form>
    </div>
  );
};
