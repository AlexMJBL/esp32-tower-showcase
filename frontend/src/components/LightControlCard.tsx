import React from 'react';
import { Sun, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export const LightControlCard: React.FC = () => {
  const { language, t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl border border-slate-800 flex flex-col justify-between">
      {/* Halo discret ambre */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl bg-amber-500/10 pointer-events-none" />

      <div>
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{t.lighting.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Barrina T8 (42W)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'fr' 
                  ? 'Spectre complet 5000K Daylight White non-graduable' 
                  : 'Full spectrum 5000K Daylight White non-dimmable output'}
              </p>
            </div>
          </div>
        </div>

        {/* Détails du matériel selon le fabricant */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-300 mb-5 leading-relaxed">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">
                {language === 'fr' ? 'Modèle & Puissance' : 'Model & Power'}
              </span>
              <strong className="text-white text-xs block">Barrina T8 V-Shape 4FT</strong>
              <span className="text-[10px] text-amber-400 font-semibold">
                {language === 'fr' ? '168W total (4 × 42W)' : '168W total (4 × 42W)'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">
                {language === 'fr' ? 'Indice de Rendu & Couleur' : 'Color Rendering & Temp'}
              </span>
              <strong className="text-white text-xs block">CRI 98+ High Output</strong>
              <span className="text-[10px] text-emerald-400 font-semibold">5000K Daylight White</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            {t.lighting.fixedNote}
          </p>
        </div>

        {/* Représentation visuelle du spectre (identique à l'image fournie) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">
              {language === 'fr' ? 'Profil Spectral Continu (380 nm - 800 nm)' : 'Continuous Spectral Profile (380 nm - 800 nm)'}
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              {language === 'fr' ? 'Pic 450nm (Bleu) & 630-660nm (Rouge)' : 'Peak 450nm (Blue) & 630-660nm (Red)'}
            </span>
          </div>

          {/* Dégradé spectral fidèle */}
          <div className="relative h-6 w-full rounded-xl overflow-hidden border border-slate-800 flex shadow-inner">
            <div 
              className="h-full w-full"
              style={{
                background: 'linear-gradient(to right, #4c1d95 0%, #2563eb 15%, #06b6d4 25%, #10b981 40%, #eab308 60%, #ef4444 80%, #7f1d1d 100%)',
                opacity: 0.85
              }}
            />
            {/* Lignes de repères */}
            <div className="absolute inset-0 flex justify-between px-3 text-[9px] font-bold text-white/90 items-center drop-shadow">
              <span>380nm (UV)</span>
              <span>480nm</span>
              <span>580nm</span>
              <span>680nm</span>
              <span>800nm (IR)</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
            <span>
              {language === 'fr' ? 'Émission continue équilibrée (Photosynthèse PAR)' : 'Balanced continuous emission (PAR Photosynthesis)'}
            </span>
            <span className="text-emerald-400 font-medium">1 µmol/s/m² ≈ 66.7 Lux</span>
          </div>
        </div>
      </div>

      {/* Statut opérationnel */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {language === 'fr' ? 'Éclairage étalonné' : 'Calibrated Fixture'}
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {language === 'fr' ? 'Spectre continu' : 'Continuous spectrum'}
        </span>
      </div>
    </div>
  );
};
