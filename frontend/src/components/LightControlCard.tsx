import React, { useState, useEffect } from 'react';
import { Sun, Palette, Calendar, Lock } from 'lucide-react';

interface LightProps {
  isOn: boolean;
  red: number;
  green: number;
  blue: number;
  startHour: number;
  dailyDurationHours: number;
  onUpdate: (isOn: boolean, red: number, green: number, blue: number, startHour: number, duration: number) => void;
  readonly?: boolean;
}

export const LightControlCard: React.FC<LightProps> = ({
  isOn,
  red,
  green,
  blue,
  startHour,
  dailyDurationHours,
  onUpdate,
  readonly = false,
}) => {
  // États locaux
  const [rVal, setRVal] = useState(red);
  const [gVal, setGVal] = useState(green);
  const [bVal, setBVal] = useState(blue);
  const [start, setStart] = useState(startHour);
  const [duration, setDuration] = useState(dailyDurationHours);
  const [isSaving, setIsSaving] = useState(false);

  // Sync avec le temps réel
  useEffect(() => {
    setRVal(red);
  }, [red]);
  useEffect(() => {
    setGVal(green);
  }, [green]);
  useEffect(() => {
    setBVal(blue);
  }, [blue]);
  useEffect(() => {
    setStart(startHour);
  }, [startHour]);
  useEffect(() => {
    setDuration(dailyDurationHours);
  }, [dailyDurationHours]);

  const handleToggle = () => {
    if (readonly) return;
    onUpdate(!isOn, rVal, gVal, bVal, start, duration);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readonly) return;
    setIsSaving(true);
    try {
      await onUpdate(isOn, rVal, gVal, bVal, start, duration);
    } finally {
      setIsSaving(false);
    }
  };

  // Convertisseur RGB en couleur CSS
  const rgbString = `rgb(${rVal}, ${gVal}, ${bVal})`;
  const shadowGlow = isOn 
    ? `0 0 25px 2px rgba(${rVal}, ${gVal}, ${bVal}, 0.5)`
    : 'none';

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
        readonly ? 'border-slate-800/80 opacity-90' : 'border-slate-800 hover:border-purple-500/30'
      }`}
      style={{
        boxShadow: shadowGlow,
        transition: 'box-shadow 0.5s ease, border-color 0.3s ease'
      }}
    >
      {/* Halo de couleur LED en arrière-plan */}
      <div 
        className="absolute -right-24 -top-24 h-48 w-48 rounded-full blur-3xl opacity-30 transition-all duration-500"
        style={{
          backgroundColor: isOn ? rgbString : 'rgba(255,255,255,0.02)'
        }}
      ></div>

      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl transition-all duration-300"
            style={{
              backgroundColor: isOn ? `rgba(${rVal}, ${gVal}, ${bVal}, 0.1)` : 'rgba(30, 41, 59, 0.8)',
              color: isOn ? rgbString : '#94a3b8'
            }}
          >
            <Sun className={`h-6 w-6 ${isOn ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-slate-100">Éclairage Horticole</h3>
              {readonly && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 text-slate-500 border border-slate-800/60 rounded-full text-[9px] uppercase font-bold tracking-wider">
                  <Lock className="h-2.5 w-2.5" /> Lecture seule
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 text-left">Spectre RGB ajustable</p>
          </div>
        </div>

        {/* Bouton Power */}
        <button
          onClick={handleToggle}
          disabled={readonly}
          className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all duration-300 focus:outline-none ${
            readonly ? 'bg-slate-900 border border-slate-850 cursor-not-allowed text-slate-700' : 'bg-slate-800 cursor-pointer'
          }`}
          style={{
            backgroundColor: readonly ? undefined : isOn ? rgbString : '#1e293b'
          }}
        >
          <span className="sr-only">Toggle Light</span>
          <span
            className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-300 ${
              isOn ? 'translate-x-10' : 'translate-x-2'
            }`}
          />
        </button>
      </div>

      {/* Aperçu visuel du spectre */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium text-left">Spectre actif</span>
          <span className="text-xs font-mono text-slate-500 text-left">
            HEX: #{rVal.toString(16).padStart(2, '0')}{gVal.toString(16).padStart(2, '0')}{bVal.toString(16).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Rond de couleur interactif */}
          <div 
            className={`h-12 w-12 rounded-full border border-slate-700 transition-all duration-500 ${isOn ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: rgbString,
              boxShadow: isOn ? `0 0 15px ${rgbString}` : 'none'
            }}
          ></div>
          <span className={`text-sm font-semibold uppercase tracking-wider ${isOn ? 'text-purple-400' : 'text-slate-500'}`}>
            {isOn ? 'ACTIF' : 'ÉTEINT'}
          </span>
        </div>
      </div>

      {/* Formulaire des paramètres */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Contrôles de couleurs */}
        <div className="space-y-3.5 bg-slate-950/30 p-3 rounded-2xl border border-slate-800/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
            <Palette className="h-4 w-4" /> Ajustement des couleurs
          </div>

          {/* ROUGE */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-red-400">Canal Rouge</span>
              <span className="text-slate-300 font-mono">{rVal}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={rVal}
              disabled={readonly}
              onChange={(e) => setRVal(Number(e.target.value))}
              className={`w-full h-1 rounded appearance-none cursor-pointer ${
                readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-red-500'
              }`}
            />
          </div>

          {/* VERT */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400">Canal Vert</span>
              <span className="text-slate-300 font-mono">{gVal}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={gVal}
              disabled={readonly}
              onChange={(e) => setGVal(Number(e.target.value))}
              className={`w-full h-1 rounded appearance-none cursor-pointer ${
                readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-emerald-500'
              }`}
            />
          </div>

          {/* BLEU */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-400">Canal Bleu</span>
              <span className="text-slate-300 font-mono">{bVal}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={bVal}
              disabled={readonly}
              onChange={(e) => setBVal(Number(e.target.value))}
              className={`w-full h-1 rounded appearance-none cursor-pointer ${
                readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Planification horaire */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Calendar className="h-4 w-4" /> Cycle Photopériode
          </div>

          {/* Heure de début */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Allumage automatique</span>
              <span className="text-purple-400 font-semibold">{start}:00</span>
            </div>
            <input 
              type="range" min="0" max="23" value={start}
              disabled={readonly}
              onChange={(e) => setStart(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-purple-500'
              }`}
            />
          </div>

          {/* Durée journalière */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Durée d'éclairage</span>
              <span className="text-purple-400 font-semibold">{duration} heures / jour</span>
            </div>
            <input 
              type="range" min="1" max="24" value={duration}
              disabled={readonly}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                readonly ? 'bg-slate-900 accent-slate-600 cursor-not-allowed' : 'bg-slate-800 accent-purple-500'
              }`}
            />
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={readonly || isSaving || (red === rVal && green === gVal && blue === bVal && startHour === start && dailyDurationHours === duration)}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 border ${
            readonly ? 'bg-slate-950/20 text-slate-600 border-slate-900/60 cursor-not-allowed' :
            isSaving ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
            (red === rVal && green === gVal && blue === bVal && startHour === start && dailyDurationHours === duration) ? 'bg-slate-800 text-slate-600 border-transparent cursor-default' :
            'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white cursor-pointer'
          }`}
        >
          {readonly ? 'Connexion requise pour modifier' : isSaving ? 'Application...' : 'Appliquer le spectre & cycle'}
        </button>
      </form>
    </div>
  );
};
