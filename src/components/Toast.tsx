import { useEffect } from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 2800 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-20 right-5 z-50 animate-slide-in flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1a1410]/95 border border-border-warm shadow-2xl backdrop-blur-2xl max-w-md shadow-black/80 card-glow">
      {type === 'success' && <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 text-[#ff9138] shrink-0" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-error shrink-0" />}

      <span className="text-xs font-medium text-text-primary flex-1">{message}</span>

      <button
        onClick={onClose}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
