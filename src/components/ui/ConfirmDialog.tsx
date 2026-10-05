import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/* ============================================================
   CONFIRM DIALOG — replaces raw window.confirm() with an
   on-brand, accessible confirmation sheet.
   ============================================================ */

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: async () => false });

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>(resolve => {
      setActive({ ...options, resolve });
    });

  const settle = (value: boolean) => {
    active?.resolve(value);
    setActive(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {active && (
        <div className="fixed inset-0 z-[80] bg-stone-950/40 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={active.title}
            className="animate-modal-in w-full max-w-sm bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active.danger ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gold-50 text-gold-600 border border-gold-200'}`}>
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">{active.title}</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{active.message}</p>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={() => settle(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200 transition-colors"
              >
                {active.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => settle(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors ${
                  active.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-maroon-600 hover:bg-maroon-500'
                }`}
              >
                {active.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
