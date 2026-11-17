import type { Rol } from '@prisma/client';

/** Módulos del CRM que se pueden agregar al menú lateral. */
export const MODULOS: { href: string; nombre: string; roles?: Rol[] }[] = [
  { href: '/dashboard', nombre: 'Dashboard' },
  { href: '/clientes', nombre: 'Clientes' },
  { href: '/clientes/nuevo', nombre: 'Nuevo cliente' },
  { href: '/oportunidades', nombre: 'Oportunidades' },
  { href: '/oportunidades/nuevo', nombre: 'Nueva oportunidad' },
  { href: '/seguimientos', nombre: 'Seguimientos' },
  { href: '/perfil', nombre: 'Mi perfil' },
  { href: '/configuracion', nombre: 'Configuración', roles: ['ADMIN'] },
];

export interface MenuNodo {
  id: string;
  etiqueta: string;
  href: string | null;
  iconoId: string | null;
  visible: boolean;
  roles: Rol[];
  hijos: MenuNodo[];
}

let seq = 0;
const nodo = (etiqueta: string, href: string | null, extra: Partial<MenuNodo> = {}): MenuNodo => ({
  id: `default-${++seq}`,
  etiqueta,
  href,
  iconoId: null,
  visible: true,
  roles: [],
  hijos: [],
  ...extra,
});

/** Menú inicial usado mientras el administrador no guarde uno propio. */
export const MENU_POR_DEFECTO: MenuNodo[] = [
  nodo('Dashboard', '/dashboard'),
  nodo('Gestión comercial', null, {
    hijos: [nodo('Clientes', '/clientes'), nodo('Oportunidades', '/oportunidades'), nodo('Seguimientos', '/seguimientos')],
  }),
  nodo('Configuración', '/configuracion', { roles: ['ADMIN'] }),
];

export function esExterno(href: string | null): boolean {
  return !!href && /^https:\/\//i.test(href);
}
