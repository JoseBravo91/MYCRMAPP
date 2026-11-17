import { describe, expect, it } from 'vitest';
import { filtrarMenu, menuSchema } from '@/lib/services/menu';
import { MENU_POR_DEFECTO, type MenuNodo } from '@/lib/modules';

const nodo = (p: Partial<MenuNodo>): MenuNodo => ({ id: p.etiqueta ?? 'x', etiqueta: 'X', href: '/x', iconoId: null, visible: true, roles: [], hijos: [], ...p });

describe('menú', () => {
  it('oculta Configuración a quien no es administrador', () => {
    const hrefs = (m: MenuNodo[]) => m.flatMap((n) => [n.href, ...n.hijos.map((h) => h.href)]);
    expect(hrefs(filtrarMenu(MENU_POR_DEFECTO, 'ADMIN'))).toContain('/configuracion');
    expect(hrefs(filtrarMenu(MENU_POR_DEFECTO, 'VENDEDOR'))).not.toContain('/configuracion');
  });

  it('descarta elementos ocultos y grupos que quedan vacíos', () => {
    const menu = [
      nodo({ etiqueta: 'Oculto', visible: false }),
      nodo({ etiqueta: 'Grupo', href: null, hijos: [nodo({ etiqueta: 'Solo admin', roles: ['ADMIN'] })] }),
    ];
    expect(filtrarMenu(menu, 'GERENTE')).toEqual([]);
  });

  it('rechaza enlaces peligrosos', () => {
    for (const href of ['javascript:alert(1)', 'http://inseguro.co', '//evil.co', '/ruta con espacios']) {
      expect(menuSchema.safeParse([{ etiqueta: 'A', href, iconoId: null, visible: true, roles: [], hijos: [] }]).success).toBe(false);
    }
  });

  it('acepta rutas internas y https', () => {
    const r = menuSchema.safeParse([
      { etiqueta: 'A', href: '/clientes', iconoId: null, visible: true, roles: [], hijos: [] },
      { etiqueta: 'B', href: 'https://unad.edu.co', iconoId: null, visible: true, roles: ['ADMIN'], hijos: [] },
    ]);
    expect(r.success).toBe(true);
  });
});
