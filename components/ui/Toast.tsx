'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tipo = 'success' | 'error';
interface ToastItem {
  id: number;
  tipo: Tipo;
  mensaje: string;
}

const ToastContext = createContext<(mensaje: string, tipo?: Tipo) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((mensaje: string, tipo: Tipo = 'success') => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t.slice(-2), { id, tipo, mensaje }]);
    setTimeout(() => setItems((t) => t.filter((i) => i.id !== id)), tipo === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tipo === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-pop animate-[toast-in_200ms_ease-out] ${
              t.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${t.tipo === 'error' ? 'bg-white' : 'bg-emerald-400'}`} aria-hidden="true" />
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
