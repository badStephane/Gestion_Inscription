import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth, MIN_PASSWORD_LENGTH } from './AuthGate';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setSuccess(false);
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (next !== confirm) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (next === current) {
      setError('Le nouveau mot de passe doit etre different de l\'ancien.');
      return;
    }

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? 'Erreur inconnue.');
      return;
    }

    setSuccess(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        className="panel shadow-xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <h3 id="change-password-title" className="text-sm font-semibold text-gray-800">
              Changer le mot de passe
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

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">Mot de passe mis a jour.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <label htmlFor="current-pwd" className="block text-xs font-medium text-gray-600 mb-1">
                Mot de passe actuel
              </label>
              <input
                ref={firstInputRef}
                id="current-pwd"
                type={showPasswords ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                className="input-field"
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="new-pwd" className="block text-xs font-medium text-gray-600 mb-1">
                Nouveau mot de passe
              </label>
              <input
                id="new-pwd"
                type={showPasswords ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="confirm-pwd" className="block text-xs font-medium text-gray-600 mb-1">
                Confirmer
              </label>
              <input
                id="confirm-pwd"
                type={showPasswords ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
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
                disabled={busy || !current || !next || !confirm}
                className="btn btn-primary disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? 'Enregistrement...' : 'Mettre a jour'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
