import type { ReactNode } from 'react';

const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-brand/20 bg-brand-light text-brand-ink',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function Alert({ type = 'error', children }: { type?: keyof typeof STYLES; children: ReactNode }) {
  if (!children) return null;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${STYLES[type]}`}>
      {children}
    </div>
  );
}
