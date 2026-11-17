/* eslint-disable @next/next/no-img-element -- avatar servido desde la API, ya recortado */
import { assetUrl } from '@/lib/assets';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-28 w-28 text-3xl' };

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

interface Props {
  nombre: string;
  avatarId?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ nombre, avatarId, src, size = 'md', className = '' }: Props) {
  const url = src ?? assetUrl(avatarId);
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-fg ring-2 ring-white ${SIZES[size]} ${className}`}>
      {url ? <img src={url} alt={`Foto de ${nombre}`} className="h-full w-full object-cover" /> : <span aria-hidden="true">{iniciales(nombre)}</span>}
    </span>
  );
}
