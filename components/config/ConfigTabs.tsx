'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/configuracion/apariencia', label: 'Apariencia', desc: 'Colores y marca' },
  { href: '/configuracion/menu', label: 'Menú', desc: 'Orden y módulos' },
  { href: '/configuracion/iconos', label: 'Iconos', desc: 'Biblioteca y ubicaciones' },
  { href: '/configuracion/usuarios', label: 'Usuarios', desc: 'Accesos y roles' },
];

export function ConfigTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de configuración" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col rounded-lg px-4 py-2 transition-colors duration-150 ${
                  active ? 'bg-brand text-brand-fg shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-sm font-semibold">{t.label}</span>
                <span className={`text-xs ${active ? 'opacity-80' : 'text-slate-400'}`}>{t.desc}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
