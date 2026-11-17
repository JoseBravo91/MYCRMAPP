'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AppIcon, useHasIcon } from './AppIcon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const hasCloseIcon = useHasIcon('nav.cerrar');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={`w-[calc(100%-2rem)] ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl p-0 shadow-pop backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-2 inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          {hasCloseIcon ? <AppIcon slot="nav.cerrar" size="md" /> : 'Cerrar'}
        </button>
      </div>
      <div className="max-h-[78vh] overflow-y-auto px-6 py-5">{children}</div>
    </dialog>
  );
}
