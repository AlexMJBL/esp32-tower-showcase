import React, { useState } from 'react';
import { Lock, ShieldAlert, Cpu, X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface LoginModalProps {
  onLoginSuccess: (token: string, username: string) => void;
  onClose: () => void;
  backendUrl: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose, backendUrl }) => {
  const { language, t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Détection du mode showcase / démo direct
      if (username === 'admin' && (password === 'SecureAdminPassword123!' || password === 'admin' || password === 'admin123')) {
        setTimeout(() => {
          onLoginSuccess('jwt-showcase-admin-token', 'admin');
        }, 300);
        return;
      }

      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        onLoginSuccess(data.token, data.username);
      } else {
        setError(data.error || (language === 'fr' ? "Nom d'utilisateur ou mot de passe incorrect." : "Invalid username or password."));
      }
    } catch {
      // Fallback si le serveur C# n'est pas démarré (Mode Cloud Showcase pur)
      if (username === 'admin') {
        onLoginSuccess('jwt-showcase-admin-token', 'admin');
      } else {
        setError(language === 'fr' 
          ? "Identifiants démo : utilisateur 'admin', mot de passe 'SecureAdminPassword123!'" 
          : "Demo credentials: username 'admin', password 'SecureAdminPassword123!'");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      
      {/* Fenêtre modale */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 p-8 shadow-2xl border border-slate-800 backdrop-blur-xl overflow-hidden">
        
        {/* Bouton de fermeture en haut à droite */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
          title={language === 'fr' ? "Fermer" : "Close"}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Effet lumineux d'arrière-plan */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>

        {/* LOGO & TITRE */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-3 border border-indigo-500/20">
            <Cpu className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white m-0 uppercase">{t.loginModal.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.loginModal.subtitle}</p>
        </div>

        {/* MESSAGES D'ERREUR */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Identifiant */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-left">
              {t.loginModal.username}
            </label>
            <input
              type="text"
              required
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-left">
              {t.loginModal.password}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none disabled:transform-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>{language === 'fr' ? 'Authentification...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> {t.loginModal.submit}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs border border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {t.loginModal.cancel}
            </button>
          </div>

          {/* Indication des identifiants par défaut */}
          <div className="pt-3 text-[9px] text-slate-500 border-t border-slate-800/60 text-center">
            {language === 'fr' ? 'Identifiants démo :' : 'Demo credentials:'}{' '}
            <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">admin</code> /{' '}
            <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">SecureAdminPassword123!</code>
          </div>

        </form>

      </div>
    </div>
  );
};
