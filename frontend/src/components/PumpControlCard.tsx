import React from 'react';
import { Droplet, Wrench, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface PumpProps {
  isActive?: boolean;
  isPumpRunning?: boolean;
  openDurationSeconds?: number;
  openIntervalMinutes?: number;
  onUpdate?: (isActive: boolean, duration: number, interval: number) => void;
  readonly?: boolean;
}

export const PumpControlCard: React.FC<PumpProps> = ({
  openDurationSeconds = 60,
  openIntervalMinutes = 15,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl border border-slate-800 flex flex-col justify-between">
      {/* Halo discret violet/bleu */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl bg-sky-500/10 pointer-events-none" />

      <div>
        {/* En-tête avec Badge En Développement */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Module d'Irrigation</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  En développement
                </span>
              </div>
              <p className="text-xs text-slate-400">Automatisation des cycles d'arrosage</p>
            </div>
          </div>
        </div>

        {/* Message explicatif physique */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-300 mb-5 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Raccordement physique en attente :</strong>
            Les relais de commande de pompe et les électrovannes ne sont pas encore reliés au microcontrôleur ESP32. Les contrôles sont temporairement verrouillés pour des raisons de sécurité matérielle.
          </div>
        </div>

        {/* Paramètres programmés prévisionnels (Preview) */}
        <div className="space-y-3 mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Paramètres prévisionnels du cycle
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" />
                Durée de marche
              </span>
              <span className="text-xl font-bold text-slate-300">{openDurationSeconds} s</span>
              <span className="text-[10px] text-slate-500 block">Arrosage actif</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                Intervalle de repos
              </span>
              <span className="text-xl font-bold text-slate-300">{openIntervalMinutes} min</span>
              <span className="text-[10px] text-slate-500 block">Pause entre cycles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer informatif */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Boucle anti-fuite prête
        </span>
        <span className="text-slate-400 font-mono">Disponibilité : Prochaine phase</span>
      </div>
    </div>
  );
};
