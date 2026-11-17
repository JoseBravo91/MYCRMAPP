import { AppIcon } from '@/components/ui/AppIcon';

interface KPIsCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'brand' | 'accent' | 'green' | 'slate';
  /** Ubicación de icono configurable */
  icon?: string;
}

const ACCENT = {
  brand: 'bg-brand-light',
  accent: 'bg-accent-light',
  green: 'bg-emerald-50',
  slate: 'bg-slate-100',
};

const BAR = { brand: 'bg-brand', accent: 'bg-accent', green: 'bg-emerald-500', slate: 'bg-slate-400' };

export function KPIsCard({ label, value, hint, accent = 'brand', icon }: KPIsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-pop">
      <span className={`absolute inset-x-0 top-0 h-1 ${BAR[accent]}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl empty:hidden ${ACCENT[accent]}`}>
            <AppIcon slot={icon} size="md" />
          </span>
        )}
      </div>
      <p className="mt-3 break-words text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
