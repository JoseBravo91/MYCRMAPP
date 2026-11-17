'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLogout } from '@/hooks/useAuth';
import type { SessionUser } from '@/lib/auth/session';
import { ROL_LABEL } from '@/lib/auth/rbac';
import { AppIcon, useHasIcon } from './AppIcon';
import { Avatar } from './Avatar';

function UserMenu({ user }: { user: SessionUser }) {
  const { logout, loggingOut } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-slate-100 sm:pr-3"
      >
        <Avatar nombre={user.nombre} avatarId={user.avatarId} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight text-slate-900">{user.nombre}</span>
          <span className="block text-xs leading-tight text-slate-500">{ROL_LABEL[user.rol]}</span>
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          <div className="border-b border-slate-100 px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user.nombre}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href="/perfil" className={item} onClick={() => setOpen(false)}>
              <AppIcon slot="nav.perfil" size="sm" />
              Mi perfil
            </Link>
            {user.rol === 'ADMIN' && (
              <Link role="menuitem" href="/configuracion" className={item} onClick={() => setOpen(false)}>
                <AppIcon slot="nav.configuracion" size="sm" />
                Configuración
              </Link>
            )}
            <button role="menuitem" type="button" onClick={logout} disabled={loggingOut} className={`${item} text-red-600 hover:bg-red-50`}>
              <AppIcon slot="accion.salir" size="sm" />
              {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar({ user, onMenu }: { user: SessionUser; onMenu: () => void }) {
  const hasMenuIcon = useHasIcon('nav.menu');
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:hidden"
      >
        {hasMenuIcon ? <AppIcon slot="nav.menu" size="lg" /> : 'Menú'}
      </button>
      <div className="ml-auto">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
