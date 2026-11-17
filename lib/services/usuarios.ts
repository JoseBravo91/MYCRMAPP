import type { Rol } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllForUser } from '@/lib/auth/tokens';
import type { SessionUser } from '@/lib/auth/session';
import { AppError, NotFound } from '@/lib/errors';

export const usuarioPublicSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  avatarId: true,
  ultimoAcceso: true,
  createdAt: true,
} as const;

export function listUsuarios() {
  return prisma.usuario.findMany({ orderBy: { createdAt: 'asc' }, select: usuarioPublicSelect });
}

export function listUsuariosActivos() {
  return prisma.usuario.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, rol: true },
  });
}

export async function createUsuario(input: { nombre: string; email: string; password: string; rol: Rol }) {
  const exists = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError(409, 'Ya existe un usuario con ese correo');
  return prisma.usuario.create({
    data: { nombre: input.nombre, email: input.email, rol: input.rol, passwordHash: await hashPassword(input.password) },
    select: usuarioPublicSelect,
  });
}

async function assertQuedaAdmin(excluirId: string) {
  const admins = await prisma.usuario.count({ where: { rol: 'ADMIN', activo: true, id: { not: excluirId } } });
  if (admins === 0) throw new AppError(409, 'Debe existir al menos un administrador activo');
}

export async function updateUsuario(
  actor: SessionUser,
  id: string,
  input: { nombre?: string; rol?: Rol; activo?: boolean; password?: string },
) {
  const target = await prisma.usuario.findUnique({ where: { id } });
  if (!target) throw NotFound('Usuario');

  const pierdeAdmin = target.rol === 'ADMIN' && ((input.rol && input.rol !== 'ADMIN') || input.activo === false);
  if (pierdeAdmin) await assertQuedaAdmin(id);
  if (actor.id === id && (input.activo === false || (input.rol && input.rol !== actor.rol))) {
    throw new AppError(409, 'No puedes desactivarte ni cambiar tu propio rol');
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: {
      nombre: input.nombre,
      rol: input.rol,
      activo: input.activo,
      ...(input.password
        ? { passwordHash: await hashPassword(input.password), intentosFallidos: 0, bloqueadoHasta: null }
        : {}),
    },
    select: usuarioPublicSelect,
  });

  // Cambios sensibles cierran las sesiones existentes del usuario afectado.
  if (input.password || input.activo === false || (input.rol && input.rol !== target.rol)) {
    await revokeAllForUser(id);
  }
  return updated;
}
