import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X, AlertCircle, CheckCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { hasRecoveryCode, setRecoveryCode, clearRecoveryCode } from '../utils/auth';

interface RecoveryCodeModalProps {
  open: boolean;
  onClose: () => void;
}

const MIN_CODE_LENGTH = 4;

const RecoveryCodeModal: React.FC<RecoveryCodeModalProps> = ({ open, onClose }) => {
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setCode('');
    setConfirm('');
    setError(null);
    setSuccess(null);
    setShowCode(false);
    (async () => {
      try {
        const exists = await hasRecoveryCode();
        setHasCode(exists);
      } catch (err) {
        console.error('Error loading recovery state:', err);
        setHasCode(false);
      }
    })();
    const t = setTimeout(() => inputRef.current?.focus(), 50);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length < MIN_CODE_LENGTH) {
      setError(`Le code doit faire au moins ${MIN_CODE_LENGTH} caracteres.`);
      return;
    }
    if (code !== confirm) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await setRecoveryCode(code.trim());
      setSuccess(hasCode ? 'Code de recuperation mis a jour.' : 'Code de recuperation enregistre.');
      setHasCode(true);
      setCode('');
      setConfirm('');
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error('Error saving recovery code:', err);
      setError('Erreur lors de l\'enregistrement.');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setBusy(true);
    try {
      await clearRecoveryCode();
      setHasCode(false);
      setSuccess('Code de recuperation supprime.');
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error('Error clearing recovery code:', err);
      setError('Erreur lors de la suppression.');
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
      aria-labelledby="recovery-code-title"
    >
      <div
        className="panel shadow-xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-blue-600" />
            <h3 id="recovery-code-title" className="text-sm font-semibold text-gray-800">
              Code de recuperation
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
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        ) : hasCode === null ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-4 space-y-3">
            <p className="text-xs text-gray-500">
              {hasCode
                ? 'Vous avez deja un code de recuperation. Vous pouvez le remplacer ou le supprimer.'
                : 'Definissez un code (mot, phrase, suite de chiffres) qui vous permettra de recuperer l\'acces si vous oubliez votre mot de passe. Notez-le dans un endroit sur.'}
            </p>
            <div>
              <label htmlFor="rec-code" className="block text-xs font-medium text-gray-600 mb-1">
                {hasCode ? 'Nouveau code' : 'Code de recuperation'}
              </label>
              <input
                ref={inputRef}
                id="rec-code"
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                className="input-field"
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="rec-code2" className="block text-xs font-medium text-gray-600 mb-1">
                Confirmer
              </label>
              <input
                id="rec-code2"
                type={showCode ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                className="input-field"
                disabled={busy}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCode(s => !s)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {showCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showCode ? 'Masquer' : 'Afficher'}
            </button>

            {error && (
              <div className="flex items-start gap-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
              {hasCode ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={busy}
                  className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn btn-default" disabled={busy}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={busy || !code || !confirm}
                  className="btn btn-primary disabled:opacity-50 disabled:pointer-events-none"
                >
                  {busy ? 'Enregistrement...' : hasCode ? 'Mettre a jour' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecoveryCodeModal;
