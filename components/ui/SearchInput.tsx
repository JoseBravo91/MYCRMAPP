'use client';

import { AppIcon, useHasIcon } from './AppIcon';

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const hasIcon = useHasIcon('accion.buscar');
  return (
    <div className="relative w-full sm:max-w-xs">
      {hasIcon && <AppIcon slot="accion.buscar" size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`block h-10 w-full rounded-lg border border-slate-300 pr-3 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 ${hasIcon ? 'pl-9' : 'pl-3'}`}
      />
    </div>
  );
}
