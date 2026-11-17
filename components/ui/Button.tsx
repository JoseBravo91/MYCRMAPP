import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { Spinner } from './Spinner';
import { AppIcon } from './AppIcon';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg shadow-sm hover:bg-brand-dark',
  accent: 'bg-accent text-accent-fg shadow-sm hover:bg-accent-dark',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

const SIZES: Record<Size, string> = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm' };

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Ubicación de icono configurable (Configuración → Iconos) */
  icon?: string;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, disabled, className = '', children, type = 'button', ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, size, className)}>
      {loading ? <Spinner className="h-4 w-4" /> : icon && <AppIcon slot={icon} size="sm" />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  icon?: string;
}

export function LinkButton({ variant = 'primary', size = 'md', icon, className = '', children, ...props }: LinkButtonProps) {
  return (
    <Link {...props} className={buttonClasses(variant, size, className)}>
      {icon && <AppIcon slot={icon} size="sm" />}
      {children}
    </Link>
  );
}
