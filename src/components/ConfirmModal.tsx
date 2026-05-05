import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRendered(false), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Focus management
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Keyboard: Escape + Focus trap
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!rendered) return null;

  const confirmBtnClass = variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${
        visible ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0'
      }`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        ref={dialogRef}
        className={`panel shadow-xl max-w-sm w-full mx-4 overflow-hidden transition-all duration-150 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            {variant === 'danger' && (
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <h3 id="confirm-modal-title" className="text-sm font-semibold text-gray-800 truncate">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 text-sm text-gray-600">{message}</div>

        <div className="flex justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button ref={cancelRef} onClick={onCancel} className="btn btn-default">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={confirmBtnClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
