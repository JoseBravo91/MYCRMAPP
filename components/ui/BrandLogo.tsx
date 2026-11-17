'use client';

/* eslint-disable @next/next/no-img-element -- logo configurable servido desde la API */
import { useSettings, type ClientSettings } from '@/components/providers/SettingsProvider';

const SIZES = { sm: 'h-8 max-w-[150px]', md: 'h-10 max-w-[190px]', lg: 'h-14 max-w-[240px]' };

/** Logo de la marca en un marco de alto fijo; sin logo se muestra el nombre de la aplicación. */
export function BrandLogo({ size = 'sm', className = '', marca: forced }: { size?: keyof typeof SIZES; className?: string; marca?: ClientSettings['marca'] }) {
  const ctx = useSettings();
  const marca = forced ?? ctx.marca;
  const showName = marca.mostrarNombre;
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      {marca.logoUrl && <img src={marca.logoUrl} alt={marca.nombre} className={`${SIZES[size]} w-auto shrink-0 object-contain object-left`} />}
      {(showName || !marca.logoUrl) && <span className="truncate text-lg font-extrabold tracking-tight">{marca.nombre}</span>}
    </span>
  );
}
