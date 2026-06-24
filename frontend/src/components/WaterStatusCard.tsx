import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Droplet } from 'lucide-react';

interface WaterStatusProps {
  floatSwitchState: boolean; // True = niveau OK, False = critique bas
  waterDetector1: boolean;   // Nord (Leak)
  waterDetector2: boolean;   // Est (Leak)
  waterDetector3: boolean;   // Sud (Leak)
  waterDetector4: boolean;   // Ouest (Leak)
}

export const WaterStatusCard: React.FC<WaterStatusProps> = ({
  floatSwitchState,
  waterDetector1,
  waterDetector2,
  waterDetector3,
  waterDetector4,
}) => {
  // Déterminer la hauteur d'eau approximative (binary: full/empty)
  const fillHeight = floatSwitchState ? 80 : 15;
  const hasLeak = waterDetector1 || waterDetector2 || waterDetector3 || waterDetector4;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
      hasLeak 
        ? 'border-red-500/40 shadow-red-550/10' 
        : !floatSwitchState 
          ? 'border-amber-500/40 shadow-amber-550/10'
          : 'border-slate-800 hover:border-sky-500/30'
    }`}>
      
      {/* Halo d'alarme ou de calme */}
      <div className={`absolute -right-24 -top-24 h-48 w-48 rounded-full blur-3xl opacity-20 transition-all duration-500 ${
        hasLeak 
          ? 'bg-red-500/35 animate-pulse' 
          : floatSwitchState 
            ? 'bg-sky-500/10' 
            : 'bg-amber-500/20'
      }`}></div>

      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-100">Sécurité Hydraulique</h3>
          <p className="text-xs text-slate-400">Réservoir & Détecteurs de Fuites</p>
        </div>

        {/* Alerte flottante */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          hasLeak
            ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
            : floatSwitchState 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
        }`}>
          {hasLeak ? (
            <>
              <AlertTriangle className="h-4 w-4 animate-bounce" /> Fuite Détectée !
            </>
          ) : floatSwitchState ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Réservoir OK
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4" /> Niveau Critique Bas
            </>
          )}
        </div>
      </div>

      {/* Contenu principal en grille : visualiseur de réservoir à gauche, plan au sol à droite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center">
        
        {/* Réservoir visuel */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Niveau Réservoir</span>
          <div className="relative w-32 h-44 rounded-3xl bg-slate-950/80 border-4 border-slate-800 shadow-inner overflow-hidden flex flex-col justify-end">
            
            {/* L'eau animée */}
            <div 
              className={`w-full rounded-b-2xl transition-all duration-1000 ease-out relative ${
                floatSwitchState ? 'bg-gradient-to-t from-sky-600 to-sky-400/80' : 'bg-gradient-to-t from-amber-600 to-amber-500/80'
              }`}
              style={{ height: `${fillHeight}%` }}
            >
              {/* Effet de vague animée en CSS */}
              {floatSwitchState && <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-wave rounded-full"></div>}
              
              {/* Affichage du pourcentage approximatif ou état */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-100 text-shadow text-sm tracking-wider">
                {floatSwitchState ? 'SUFFISANT' : 'BAS'}
              </div>
            </div>

            {/* Repères gradués du réservoir */}
            <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between text-[8px] font-mono text-slate-600 font-bold">
              <span>- MAX</span>
              <span>- SEUIL</span>
              <span>- MIN</span>
            </div>
          </div>
        </div>

        {/* Plan au sol des capteurs de fuite */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Détecteurs au Sol (Base)</span>
          
          <div className="relative w-40 h-40 rounded-full bg-slate-950/60 border-4 border-slate-800/80 flex items-center justify-center shadow-inner">
            {/* Corps central du cylindre de l'hydro */}
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700/50 flex flex-col items-center justify-center">
              <Droplet className={`h-5 w-5 ${hasLeak ? 'text-red-400 animate-bounce' : 'text-slate-600'}`} />
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">HYDRO</span>
            </div>

            {/* Capteur Nord (Haut) */}
            <div className="absolute top-2 flex flex-col items-center">
              <span className="text-[8px] font-mono text-slate-500 leading-none mb-0.5">NORD</span>
              <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                waterDetector1 
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${waterDetector1 ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_4px_#10b981]'}`}></span>
              </span>
            </div>

            {/* Capteur Est (Droite) */}
            <div className="absolute right-2 flex items-center gap-1">
              <span className="text-[8px] font-mono text-slate-500 leading-none">EST</span>
              <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                waterDetector2 
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${waterDetector2 ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_4px_#10b981]'}`}></span>
              </span>
            </div>

            {/* Capteur Sud (Bas) */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                waterDetector3 
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${waterDetector3 ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_4px_#10b981]'}`}></span>
              </span>
              <span className="text-[8px] font-mono text-slate-500 leading-none mt-0.5">SUD</span>
            </div>

            {/* Capteur Ouest (Gauche) */}
            <div className="absolute left-2 flex items-center gap-1">
              <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                waterDetector4 
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${waterDetector4 ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_4px_#10b981]'}`}></span>
              </span>
              <span className="text-[8px] font-mono text-slate-500 leading-none">OUEST</span>
            </div>
          </div>
        </div>

      </div>

      {/* Alerte Fuite d'eau */}
      {hasLeak && (
        <div className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 animate-pulse">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div className="text-left">
            <span className="font-bold block uppercase mb-0.5">⚠️ ARRÊT D'URGENCE : FUITE D'EAU !</span>
            Une fuite d'eau a été détectée à la base de l'hydro. La pompe a été automatiquement arrêtée par sécurité.
          </div>
        </div>
      )}

      {/* Alerte Niveau bas flotteur */}
      {!floatSwitchState && !hasLeak && (
        <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-400 animate-pulse">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-left">
            <span className="font-bold block uppercase mb-0.5">Niveau d'eau critique</span>
            Le niveau d'eau est descendu sous le flotteur de sécurité. Ajoutez de l'eau nutritive immédiatement.
          </div>
        </div>
      )}
    </div>
  );
};
