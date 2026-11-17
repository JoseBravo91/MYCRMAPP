import { z } from 'zod';
import type { Rol } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { MENU_POR_DEFECTO, type MenuNodo } from '@/lib/modules';
import { rolSchema } from '@/lib/validators';

const hrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^\/[a-zA-Z0-9\-_/]*$/.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v), {
    message: 'Usa una ruta interna (/clientes) o una URL https://',
  });

const baseItem = {
  etiqueta: z.string().trim().min(1, 'La etiqueta es obligatoria').max(40),
  href: hrefSchema.nullable(),
  iconoId: z.cuid().nullable(),
  visible: z.boolean(),
  roles: z.array(rolSchema).max(3),
};

const hijoSchema = z.object(baseItem);
const itemSchema = z.object({ ...baseItem, hijos: z.array(hijoSchema).max(30) });
export const menuSchema = z.array(itemSchema).min(1, 'El menú no puede quedar vacío').max(40);

type MenuInput = z.infer<typeof menuSchema>;

export async function getMenuCompleto(): Promise<MenuNodo[]> {
  const items = await prisma.menuItem.findMany({ orderBy: [{ orden: 'asc' }] });
  if (items.length === 0) return MENU_POR_DEFECTO;

  const toNodo = (i: (typeof items)[number]): MenuNodo => ({
    id: i.id,
    etiqueta: i.etiqueta,
    href: i.href,
    iconoId: i.iconoId,
    visible: i.visible,
    roles: i.roles,
    hijos: items.filter((h) => h.padreId === i.id).map(toNodo),
  });
  return items.filter((i) => !i.padreId).map(toNodo);
}

const visiblePara = (n: MenuNodo, rol: Rol) => n.visible && (n.roles.length === 0 || n.roles.includes(rol));

/** Menú filtrado por rol; los grupos sin hijos visibles se ocultan. */
export function filtrarMenu(menu: MenuNodo[], rol: Rol): MenuNodo[] {
  return menu
    .filter((n) => visiblePara(n, rol))
    .map((n) => ({ ...n, hijos: n.hijos.filter((h) => visiblePara(h, rol)) }))
    .filter((n) => n.href || n.hijos.length > 0);
}

/** Evita que el administrador se quede sin acceso a Configuración desde el menú. */
function validarAccesoConfiguracion(menu: MenuInput) {
  const todos = menu.flatMap((n) => [{ ...n, padreVisible: true }, ...n.hijos.map((h) => ({ ...h, padreVisible: n.visible }))]);
  const ok = todos.some(
    (n) => n.href === '/configuracion' && n.visible && n.padreVisible && (n.roles.length === 0 || n.roles.includes('ADMIN')),
  );
  if (!ok) throw new AppError(400, 'El módulo Configuración debe permanecer visible para administradores');
}

export async function guardarMenu(input: unknown) {
  const menu = menuSchema.parse(input);
  validarAccesoConfiguracion(menu);
  for (const n of menu) {
    if (n.hijos.length > 0 && n.href) throw new AppError(400, `"${n.etiqueta}" tiene elementos dentro, por eso no puede tener enlace`);
  }

  const iconos = [...new Set(menu.flatMap((n) => [n.iconoId, ...n.hijos.map((h) => h.iconoId)]).filter(Boolean))] as string[];
  if (iconos.length) {
    const existentes = await prisma.asset.count({ where: { id: { in: iconos }, tipo: 'ICON' } });
    if (existentes !== iconos.length) throw new AppError(400, 'Alguno de los iconos seleccionados ya no existe');
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.deleteMany();
    for (const [orden, n] of menu.entries()) {
      await tx.menuItem.create({
        data: {
          etiqueta: n.etiqueta,
          href: n.href,
          iconoId: n.iconoId,
          visible: n.visible,
          roles: n.roles,
          orden,
          hijos: {
            create: n.hijos.map((h, i) => ({
              etiqueta: h.etiqueta,
              href: h.href,
              iconoId: h.iconoId,
              visible: h.visible,
              roles: h.roles,
              orden: i,
            })),
          },
        },
      });
    }
  });
  return getMenuCompleto();
}
