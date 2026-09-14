import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-full shadow-inner backdrop-blur-md">
      <div className="pl-1.5 pr-0.5 text-slate-400 flex items-center">
        <Globe className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div className="relative flex items-center bg-slate-950/80 rounded-full p-0.5 border border-slate-800/80">
        {/* Pill coulissante d'arrière-plan */}
        <div
          className={`absolute top-0.5 bottom-0.5 w-[32px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 transition-all duration-300 ease-out ${
            language === 'fr' ? 'left-0.5' : 'left-[34px]'
          }`}
        />

        {/* Bouton FR */}
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`relative z-10 w-[32px] py-1 text-[11px] font-bold text-center rounded-full transition-colors duration-200 cursor-pointer ${
            language === 'fr' ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Passer en Français"
          aria-label="Passer en Français"
        >
          FR
        </button>

        {/* Bouton EN */}
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`relative z-10 w-[32px] py-1 text-[11px] font-bold text-center rounded-full transition-colors duration-200 cursor-pointer ${
            language === 'en' ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Switch to English"
          aria-label="Switch to English"
        >
          EN
        </button>
      </div>
    </div>
  );
};
