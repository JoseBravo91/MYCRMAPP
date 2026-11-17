import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { can, ownerScope } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { AppError, NotFound } from '@/lib/errors';
import type { z } from 'zod';
import type { clienteSchema } from '@/lib/validators';

type ClienteInput = z.output<typeof clienteSchema>;

export async function listClientes(user: SessionUser, opts: { page: number; pageSize: number; q: string }) {
  const where: Prisma.ClienteWhereInput = {
    deletedAt: null,
    ...ownerScope(user),
    ...(opts.q
      ? {
          OR: [
            { nombre: { contains: opts.q, mode: 'insensitive' } },
            { email: { contains: opts.q, mode: 'insensitive' } },
            { empresa: { contains: opts.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        empresa: true,
        industria: true,
        ciudad: true,
        estado: true,
        createdAt: true,
        owner: { select: { id: true, nombre: true } },
        etiquetas: { select: { id: true, nombre: true, color: true } },
        _count: { select: { oportunidades: { where: { deletedAt: null } } } },
      },
    }),
  ]);

  return { data, total, page: opts.page, pageSize: opts.pageSize, totalPages: Math.max(1, Math.ceil(total / opts.pageSize)) };
}

export async function getCliente(user: SessionUser, id: string) {
  const cliente = await prisma.cliente.findFirst({
    where: { id, deletedAt: null, ...ownerScope(user) },
    include: {
      owner: { select: { id: true, nombre: true } },
      etiquetas: { select: { id: true, nombre: true, color: true } },
      oportunidades: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, titulo: true, etapa: true, valorEstimado: true, probabilidad: true, fechaCierreEstimada: true },
      },
      seguimientos: {
        orderBy: [{ completado: 'asc' }, { fechaProgramada: 'asc' }],
        include: { oportunidad: { select: { id: true, titulo: true } }, owner: { select: { nombre: true } } },
      },
    },
  });
  if (!cliente) throw NotFound('Cliente');
  return cliente;
}

async function resolveOwner(user: SessionUser, ownerId: string | undefined): Promise<string> {
  if (!ownerId || ownerId === user.id) return user.id;
  if (!can(user.rol, 'registros:reasignar')) throw new AppError(403, 'No puedes asignar registros a otro usuario');
  const owner = await prisma.usuario.findFirst({ where: { id: ownerId, activo: true } });
  if (!owner) throw new AppError(400, 'El responsable indicado no existe o está inactivo');
  return owner.id;
}

export async function createCliente(user: SessionUser, input: ClienteInput) {
  const { etiquetaIds, ownerId, ...data } = input;
  return prisma.cliente.create({
    data: {
      ...data,
      ownerId: await resolveOwner(user, ownerId),
      etiquetas: { connect: etiquetaIds.map((id) => ({ id })) },
    },
  });
}

export async function updateCliente(user: SessionUser, id: string, input: ClienteInput) {
  const existing = await prisma.cliente.findFirst({ where: { id, deletedAt: null, ...ownerScope(user) } });
  if (!existing) throw NotFound('Cliente');
  const { etiquetaIds, ownerId, ...data } = input;
  return prisma.cliente.update({
    where: { id },
    data: {
      ...data,
      ownerId: ownerId ? await resolveOwner(user, ownerId) : existing.ownerId,
      etiquetas: { set: etiquetaIds.map((eid) => ({ id: eid })) },
    },
  });
}

/** Soft delete: conserva el histórico y oculta también sus oportunidades. */
export async function deleteCliente(user: SessionUser, id: string) {
  const existing = await prisma.cliente.findFirst({ where: { id, deletedAt: null, ...ownerScope(user) } });
  if (!existing) throw NotFound('Cliente');
  const now = new Date();
  await prisma.$transaction([
    prisma.cliente.update({ where: { id }, data: { deletedAt: now } }),
    prisma.oportunidad.updateMany({ where: { clienteId: id, deletedAt: null }, data: { deletedAt: now } }),
  ]);
}

export async function listClientesOptions(user: SessionUser) {
  return prisma.cliente.findMany({
    where: { deletedAt: null, ...ownerScope(user) },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, empresa: true },
  });
}
