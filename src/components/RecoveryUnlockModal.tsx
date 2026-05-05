import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { verifyRecoveryCode, setPassword } from '../utils/auth';

const MIN_PASSWORD_LENGTH = 6;

interface RecoveryUnlockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'code' | 'new-password';

const RecoveryUnlockModal: React.FC<RecoveryUnlockModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const pwdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep('code');
    setCode('');
    setPwd1('');
    setPwd2('');
    setError(null);
    setShowPasswords(false);
    const t = setTimeout(() => codeInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (step === 'new-password') {
      const t = setTimeout(() => pwdInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return;
    setBusy(true);
    try {
      const ok = await verifyRecoveryCode(code);
      if (ok) {
        setStep('new-password');
      } else {
        setError('Code de recuperation incorrect.');
        setCode('');
      }
    } catch (err) {
      console.error('Error verifying recovery code:', err);
      setError('Erreur lors de la verification.');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd1.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (pwd1 !== pwd2) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await setPassword(pwd1);
      onSuccess();
    } catch (err) {
      console.error('Error setting new password:', err);
      setError('Erreur lors de l\'enregistrement du nouveau mot de passe.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-unlock-title"
    >
      <div
        className="panel shadow-xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-blue-600" />
            <h3 id="recovery-unlock-title" className="text-sm font-semibold text-gray-800">
              {step === 'code' ? 'Code de recuperation' : 'Nouveau mot de passe'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} className="p-4 space-y-3">
            <p className="text-xs text-gray-500">
              Entrez le code de recuperation que vous avez configure pour debloquer l'acces.
            </p>
            <div>
              <label htmlFor="rec-code" className="block text-xs font-medium text-gray-600 mb-1">
                Code de recuperation
              </label>
              <input
                ref={codeInputRef}
                id="rec-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                className="input-field"
                disabled={busy}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn btn-default" disabled={busy}>
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="btn btn-primary disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? 'Verification...' : 'Continuer'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="p-4 space-y-3">
            <p className="text-xs text-gray-500">
              Code valide. Definissez un nouveau mot de passe.
            </p>
            <div>
              <label htmlFor="rec-new-pwd" className="block text-xs font-medium text-gray-600 mb-1">
                Nouveau mot de passe
              </label>
              <input
                ref={pwdInputRef}
                id="rec-new-pwd"
                type={showPasswords ? 'text' : 'password'}
                value={pwd1}
                onChange={(e) => setPwd1(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="rec-new-pwd2" className="block text-xs font-medium text-gray-600 mb-1">
                Confirmer
              </label>
              <input
                id="rec-new-pwd2"
                type={showPasswords ? 'text' : 'password'}
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                disabled={busy}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords(s => !s)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPasswords ? 'Masquer' : 'Afficher'}
            </button>

            {error && (
              <div className="flex items-start gap-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn btn-default" disabled={busy}>
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !pwd1 || !pwd2}
                className="btn btn-primary disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecoveryUnlockModal;
