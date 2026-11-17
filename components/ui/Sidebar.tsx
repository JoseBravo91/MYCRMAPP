'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuNodo } from '@/lib/modules';
import { esExterno } from '@/lib/modules';
import { assetUrl } from '@/lib/assets';
import { AssetImage } from './AssetImage';
import { BrandLogo } from './BrandLogo';

function activo(href: string | null, pathname: string) {
  return !!href && !esExterno(href) && (pathname === href || pathname.startsWith(`${href}/`));
}

interface NavProps {
  menu: MenuNodo[];
  /** Ruta a resaltar (en la vista previa se pasa manualmente) */
  pathname?: string;
  onNavigate?: () => void;
  /** En la vista previa los enlaces no navegan */
  preview?: boolean;
}

/** Lista de navegación reutilizada por el sidebar real y por la vista previa del editor de menú. */
export function SidebarNav({ menu, pathname: forced, onNavigate, preview }: NavProps) {
  const current = usePathname();
  const pathname = forced ?? current;
  const [cerrados, setCerrados] = useState<Set<string>>(new Set());
  // Si algún elemento tiene icono se reserva la columna para que las etiquetas queden alineadas
  const conIconos = menu.some((n) => n.iconoId || n.hijos.some((h) => h.iconoId));

  const itemClass = (isActive: boolean, nested = false) =>
    `group relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${nested ? 'pl-4' : ''} ${
      isActive ? 'bg-brand-fg/15 font-semibold text-brand-fg' : 'font-medium text-brand-fg/75 hover:bg-brand-fg/10 hover:text-brand-fg'
    }`;

  const icono = (n: MenuNodo) =>
    conIconos ? (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <AssetImage src={assetUrl(n.iconoId)} size="md" />
      </span>
    ) : null;

  const enlace = (n: MenuNodo, nested = false) => {
    const isActive = activo(n.href, pathname);
    const content = (
      <>
        {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent" aria-hidden="true" />}
        {icono(n)}
        <span className="truncate">{n.etiqueta}</span>
        {esExterno(n.href) && <span className="ml-auto text-[10px] uppercase tracking-wide opacity-60">externo</span>}
      </>
    );
    if (preview) return <span className={itemClass(isActive, nested)}>{content}</span>;
    if (esExterno(n.href)) {
      return (
        <a href={n.href!} target="_blank" rel="noopener noreferrer" className={itemClass(false, nested)}>
          {content}
        </a>
      );
    }
    return (
      <Link href={n.href!} onClick={onNavigate} aria-current={isActive ? 'page' : undefined} className={itemClass(isActive, nested)}>
        {content}
      </Link>
    );
  };

  return (
    <ul className="space-y-1">
      {menu.map((n) => {
        if (n.hijos.length === 0) return <li key={n.id}>{enlace(n)}</li>;
        const contieneActivo = n.hijos.some((h) => activo(h.href, pathname));
        const abierto = contieneActivo || !cerrados.has(n.id);
        return (
          <li key={n.id}>
            <button
              type="button"
              aria-expanded={abierto}
              onClick={() =>
                setCerrados((s) => {
                  const next = new Set(s);
                  if (next.has(n.id)) next.delete(n.id);
                  else next.add(n.id);
                  return next;
                })
              }
              className={`${itemClass(false)} justify-between`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {icono(n)}
                <span className="truncate text-xs font-bold uppercase tracking-wider">{n.etiqueta}</span>
              </span>
              <span className={`text-xs transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`} aria-hidden="true">
                ›
              </span>
            </button>
            {abierto && (
              <ul className="ml-3 mt-1 space-y-1 border-l border-brand-fg/15 pl-2">
                {n.hijos.map((h) => (
                  <li key={h.id}>{enlace(h, true)}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ menu, open, onNavigate }: { menu: MenuNodo[]; open: boolean; onNavigate: () => void }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand text-brand-fg shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-brand-fg/10 px-5">
        <BrandLogo />
      </div>
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Navegación principal">
        <SidebarNav menu={menu} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-brand-fg/10 px-5 py-4 text-xs opacity-60">UNAD · Proyecto de Grado</div>
    </aside>
  );
}
