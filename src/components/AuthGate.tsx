import React, { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import {
  hasPassword,
  setPassword,
  verifyPassword,
  resetAuthAndData,
  hasRecoveryCode,
} from '../utils/auth';
import ConfirmModal from './ConfirmModal';
import RecoveryUnlockModal from './RecoveryUnlockModal';

interface AuthGateProps {
  children: React.ReactNode;
}

type Phase = 'loading' | 'setup' | 'lock' | 'unlocked';

const MIN_PASSWORD_LENGTH = 6;

interface AuthContextValue {
  lock: () => void;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthGate>');
  return ctx;
};

export { MIN_PASSWORD_LENGTH };

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [recoveryUnlockOpen, setRecoveryUnlockOpen] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exists = await hasPassword();
        if (cancelled) return;
        setPhase(exists ? 'lock' : 'setup');
      } catch (err) {
        console.error('Error checking password state:', err);
        if (!cancelled) setPhase('setup');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase === 'lock' || phase === 'setup') {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'lock') return;
    let cancelled = false;
    hasRecoveryCode()
      .then(v => { if (!cancelled) setRecoveryAvailable(v); })
      .catch(err => {
        console.error('Error checking recovery code:', err);
        if (!cancelled) setRecoveryAvailable(false);
      });
    return () => { cancelled = true; };
  }, [phase]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password1.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password1 !== password2) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await setPassword(password1);
      setPassword1('');
      setPassword2('');
      setPhase('unlocked');
    } catch (err) {
      console.error('Error creating password:', err);
      setError('Impossible de créer le mot de passe. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password1) return;
    setBusy(true);
    try {
      const ok = await verifyPassword(password1);
      if (ok) {
        setPassword1('');
        setPhase('unlocked');
      } else {
        setError('Mot de passe incorrect.');
        setPassword1('');
        triggerShake();
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setError('Erreur lors de la vérification.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setResetOpen(false);
    try {
      await resetAuthAndData();
      setPassword1('');
      setPassword2('');
      setError(null);
      setPhase('setup');
    } catch (err) {
      console.error('Error resetting:', err);
      setError('Erreur lors de la réinitialisation.');
    }
  };

  const lock = useCallback(() => {
    setPassword1('');
    setPassword2('');
    setError(null);
    setPhase('lock');
  }, []);

  const changePassword = useCallback(
    async (current: string, next: string): Promise<{ ok: boolean; error?: string }> => {
      if (next.length < MIN_PASSWORD_LENGTH) {
        return { ok: false, error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caracteres.` };
      }
      try {
        const okCurrent = await verifyPassword(current);
        if (!okCurrent) return { ok: false, error: 'Mot de passe actuel incorrect.' };
        await setPassword(next);
        return { ok: true };
      } catch (err) {
        console.error('Error changing password:', err);
        return { ok: false, error: 'Erreur lors du changement de mot de passe.' };
      }
    },
    []
  );

  if (phase === 'unlocked') {
    return (
      <AuthContext.Provider value={{ lock, changePassword }}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isSetup = phase === 'setup';

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div
        className={`panel shadow-2xl w-full max-w-sm mx-4 ${shake ? 'animate-shake' : ''}`}
      >
        <div className="px-5 pt-5 pb-3 text-center border-b border-gray-200">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            {isSetup ? (
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            ) : (
              <Lock className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <h1 className="text-base font-semibold text-gray-900">
            {isSetup ? 'Configurer l\'accès' : 'Accès protégé'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isSetup
              ? 'Choisissez un mot de passe pour protéger l\'application.'
              : 'Entrez votre mot de passe pour continuer.'}
          </p>
        </div>

        <form onSubmit={isSetup ? handleSetup : handleUnlock} className="p-5 space-y-3">
          <div>
            <label htmlFor="password1" className="block text-xs font-medium text-gray-600 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="password1"
                type={showPassword ? 'text' : 'password'}
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                className="input-field pr-9"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div>
              <label htmlFor="password2" className="block text-xs font-medium text-gray-600 mb-1">
                Confirmer
              </label>
              <input
                id="password2"
                type={showPassword ? 'text' : 'password'}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                disabled={busy}
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !password1 || (isSetup && !password2)}
            className="btn btn-primary w-full justify-center py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {busy
              ? isSetup ? 'Création...' : 'Vérification...'
              : isSetup ? 'Créer le mot de passe' : 'Déverrouiller'}
          </button>

          {!isSetup && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() =>
                  recoveryAvailable ? setRecoveryUnlockOpen(true) : setResetOpen(true)
                }
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}
        </form>
      </div>

      <ConfirmModal
        open={resetOpen}
        title="Réinitialiser l'application"
        message="Toutes les inscriptions et le mot de passe seront définitivement supprimés. Cette action est irréversible. Continuer ?"
        confirmLabel="Tout effacer"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />

      <RecoveryUnlockModal
        open={recoveryUnlockOpen}
        onClose={() => setRecoveryUnlockOpen(false)}
        onSuccess={() => {
          setRecoveryUnlockOpen(false);
          setPassword1('');
          setPassword2('');
          setError(null);
          setPhase('unlocked');
        }}
      />
    </div>
  );
};

export default AuthGate;
