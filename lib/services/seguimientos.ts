import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ownerScope } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { AppError, NotFound } from '@/lib/errors';
import type { seguimientoSchema } from '@/lib/validators';

type SeguimientoInput = z.output<typeof seguimientoSchema>;

export async function listSeguimientos(
  user: SessionUser,
  filtros: { clienteId?: string; oportunidadId?: string; pendientes?: boolean },
) {
  // Un vendedor ve los seguimientos de sus clientes aunque los haya creado otra persona.
  const scope = ownerScope(user);
  const where: Prisma.SeguimientoWhereInput = {
    cliente: { deletedAt: null, ...scope },
    ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
    ...(filtros.oportunidadId ? { oportunidadId: filtros.oportunidadId } : {}),
    ...(filtros.pendientes ? { completado: false } : {}),
  };
  return prisma.seguimiento.findMany({
    where,
    orderBy: [{ completado: 'asc' }, { fechaProgramada: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      cliente: { select: { id: true, nombre: true } },
      oportunidad: { select: { id: true, titulo: true } },
      owner: { select: { nombre: true } },
    },
  });
}

export async function createSeguimiento(user: SessionUser, input: SeguimientoInput) {
  const cliente = await prisma.cliente.findFirst({ where: { id: input.clienteId, deletedAt: null, ...ownerScope(user) } });
  if (!cliente) throw new AppError(400, 'El cliente indicado no existe o no tienes acceso');
  if (input.oportunidadId) {
    const op = await prisma.oportunidad.findFirst({
      where: { id: input.oportunidadId, clienteId: input.clienteId, deletedAt: null },
    });
    if (!op) throw new AppError(400, 'La oportunidad no pertenece al cliente indicado');
  }
  return prisma.seguimiento.create({ data: { ...input, ownerId: user.id } });
}

async function findAccesible(user: SessionUser, id: string) {
  const seg = await prisma.seguimiento.findFirst({
    where: { id, cliente: { deletedAt: null, ...ownerScope(user) } },
  });
  if (!seg) throw NotFound('Seguimiento');
  return seg;
}

export async function setCompletado(user: SessionUser, id: string, completado: boolean) {
  await findAccesible(user, id);
  return prisma.seguimiento.update({
    where: { id },
    data: { completado, completadoEn: completado ? new Date() : null },
  });
}

export async function deleteSeguimiento(user: SessionUser, id: string) {
  await findAccesible(user, id);
  await prisma.seguimiento.delete({ where: { id } });
}
