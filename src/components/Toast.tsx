import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

interface ToastProps {
  open: boolean;
  variant: ToastVariant;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  open,
  variant,
  message,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const Icon = variant === 'success' ? CheckCircle : AlertCircle;
  const accent =
    variant === 'success'
      ? 'border-l-4 border-emerald-500'
      : 'border-l-4 border-red-500';
  const iconClass =
    variant === 'success' ? 'text-emerald-500' : 'text-red-500';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 panel shadow-lg ${accent} flex items-start gap-2 pl-3 pr-2 py-2 min-w-[260px] max-w-sm`}
    >
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
      <p className="text-sm text-gray-700 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
