import React from 'react';
import { Droplet, ShieldAlert, ShieldCheck, Waves, Info } from 'lucide-react';

interface PumpProps {
  isRunning?: boolean;
}

export const PumpControlCard: React.FC<PumpProps> = ({
  isRunning = true,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl border border-slate-800 flex flex-col justify-between">
      {/* Halo discret cyan / eau */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl bg-cyan-500/10 pointer-events-none" />

      <div>
        {/* En-tête avec Statut en Continu */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Circuit d'Irrigation</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                  isRunning 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isRunning ? 'Irrigation Continue' : 'Arrêt Sécurité'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Ruissellement permanent sur le système racinaire</p>
            </div>
          </div>
        </div>

        {/* Bloc d'état de fonctionnement nominal */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Waves className={`w-4 h-4 ${isRunning ? 'text-cyan-400 animate-bounce' : 'text-slate-500'}`} />
              <span>Régime de fonctionnement</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
              isRunning
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {isRunning ? '24h / 24 · 100% Actif' : 'Sécurité Déclenchée'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            La tour fonctionne en apport hydrique continu pour maintenir une oxygénation et une nutrition optimales sans stress hydrique.
          </p>
        </div>

        {/* Section explicative sur la future coupure de sécurité */}
        <div className="space-y-2 mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Sécurités Automatiques (En cours d'intégration)
          </span>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-slate-300">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                En conditions normales, l'arrosage ne s'arrête jamais. La possibilité de couper la pompe sera réservée exclusivement aux deux conditions de sécurité suivantes :
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <span className="text-amber-400 font-bold text-xs mt-0.5">1.</span>
                <div>
                  <strong className="text-white text-xs block">Manque d'eau</strong>
                  <span className="text-[10px] text-slate-400">Coupure d'urgence si niveau bas critique pour protéger la pompe contre la marche à sec.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <span className="text-amber-400 font-bold text-xs mt-0.5">2.</span>
                <div>
                  <strong className="text-white text-xs block">Débordement / Fuite</strong>
                  <span className="text-[10px] text-slate-400">Arrêt immédiat lors d'une détection de liquide au sol ou débordement.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer informatif */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Régime permanent sécurisé
        </span>
        <span className="text-slate-400 font-mono text-[10px]">Coupure asservie aux capteurs</span>
      </div>
    </div>
  );
};
