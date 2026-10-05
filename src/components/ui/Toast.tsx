import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* ============================================================
   TOAST SYSTEM — calm, warm, auto-dismissing notifications.
   Replaces raw alert() popups across the OS.
   ============================================================ */

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-3), { id, kind, title, message }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const kindStyles: Record<ToastKind, { icon: React.ReactNode; ring: string }> = {
    success: {
      icon: <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600 shrink-0" />,
      ring: 'border-emerald-300'
    },
    error: {
      icon: <AlertCircle className="w-[18px] h-[18px] text-red-600 shrink-0" />,
      ring: 'border-red-300'
    },
    info: {
      icon: <Info className="w-[18px] h-[18px] text-maroon-600 shrink-0" />,
      ring: 'border-gold-300'
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        aria-live="polite"
        className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[90] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map(t => {
          const s = kindStyles[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 bg-white/95 backdrop-blur border ${s.ring} rounded-xl shadow-lg shadow-stone-900/10 p-3.5`}
            >
              {s.icon}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-stone-900">{t.title}</div>
                {t.message && <div className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{t.message}</div>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="p-0.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
