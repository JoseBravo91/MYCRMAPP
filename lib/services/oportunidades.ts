import type { EtapaOportunidad, Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { can, ownerScope } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { AppError, NotFound } from '@/lib/errors';
import { PROBABILIDAD_POR_ETAPA, isAbierta } from '@/lib/kpis';
import type { oportunidadSchema } from '@/lib/validators';

type OportunidadInput = z.output<typeof oportunidadSchema>;

const listSelect = {
  id: true,
  titulo: true,
  etapa: true,
  valorEstimado: true,
  probabilidad: true,
  fechaCierreEstimada: true,
  createdAt: true,
  cliente: { select: { id: true, nombre: true, empresa: true } },
  owner: { select: { id: true, nombre: true } },
} satisfies Prisma.OportunidadSelect;

export type OportunidadListItem = Omit<Prisma.OportunidadGetPayload<{ select: typeof listSelect }>, 'valorEstimado'> & {
  valorEstimado: number;
};

function serialize<T extends { valorEstimado: Prisma.Decimal }>(o: T): Omit<T, 'valorEstimado'> & { valorEstimado: number } {
  return { ...o, valorEstimado: Number(o.valorEstimado) };
}

export async function listOportunidades(
  user: SessionUser,
  opts: { page: number; pageSize: number; q: string; etapa?: EtapaOportunidad },
) {
  const where: Prisma.OportunidadWhereInput = {
    deletedAt: null,
    ...ownerScope(user),
    ...(opts.etapa ? { etapa: opts.etapa } : {}),
    ...(opts.q
      ? {
          OR: [
            { titulo: { contains: opts.q, mode: 'insensitive' } },
            { cliente: { nombre: { contains: opts.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const [total, data] = await prisma.$transaction([
    prisma.oportunidad.count({ where }),
    prisma.oportunidad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      select: listSelect,
    }),
  ]);
  return {
    data: data.map(serialize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    totalPages: Math.max(1, Math.ceil(total / opts.pageSize)),
  };
}

/** Todas las oportunidades visibles, para el tablero Kanban. */
export async function listPipeline(user: SessionUser): Promise<OportunidadListItem[]> {
  const data = await prisma.oportunidad.findMany({
    where: { deletedAt: null, ...ownerScope(user) },
    orderBy: { updatedAt: 'desc' },
    take: 500,
    select: listSelect,
  });
  return data.map(serialize);
}

export async function getOportunidad(user: SessionUser, id: string) {
  const op = await prisma.oportunidad.findFirst({
    where: { id, deletedAt: null, ...ownerScope(user) },
    include: {
      cliente: { select: { id: true, nombre: true, empresa: true } },
      owner: { select: { id: true, nombre: true } },
      seguimientos: {
        orderBy: [{ completado: 'asc' }, { fechaProgramada: 'asc' }],
        include: { oportunidad: { select: { id: true, titulo: true } }, owner: { select: { nombre: true } } },
      },
    },
  });
  if (!op) throw NotFound('Oportunidad');
  return serialize(op);
}

async function assertClienteAccesible(user: SessionUser, clienteId: string) {
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, deletedAt: null, ...ownerScope(user) } });
  if (!cliente) throw new AppError(400, 'El cliente indicado no existe o no tienes acceso');
}

async function resolveOwner(user: SessionUser, ownerId?: string) {
  if (!ownerId || ownerId === user.id) return user.id;
  if (!can(user.rol, 'registros:reasignar')) throw new AppError(403, 'No puedes asignar registros a otro usuario');
  const owner = await prisma.usuario.findFirst({ where: { id: ownerId, activo: true } });
  if (!owner) throw new AppError(400, 'El responsable indicado no existe o está inactivo');
  return owner.id;
}

function cierreData(etapa: EtapaOportunidad, previa?: EtapaOportunidad) {
  if (!isAbierta(etapa) && (previa === undefined || isAbierta(previa))) return { cerradaEn: new Date() };
  if (isAbierta(etapa)) return { cerradaEn: null };
  return {};
}

export async function createOportunidad(user: SessionUser, input: OportunidadInput) {
  await assertClienteAccesible(user, input.clienteId);
  const { ownerId, ...data } = input;
  return prisma.oportunidad.create({
    data: { ...data, ownerId: await resolveOwner(user, ownerId), ...cierreData(data.etapa) },
  });
}

export async function updateOportunidad(user: SessionUser, id: string, input: OportunidadInput) {
  const existing = await prisma.oportunidad.findFirst({ where: { id, deletedAt: null, ...ownerScope(user) } });
  if (!existing) throw NotFound('Oportunidad');
  if (input.clienteId !== existing.clienteId) await assertClienteAccesible(user, input.clienteId);
  const { ownerId, ...data } = input;
  return prisma.oportunidad.update({
    where: { id },
    data: {
      ...data,
      ownerId: ownerId ? await resolveOwner(user, ownerId) : existing.ownerId,
      ...cierreData(data.etapa, existing.etapa),
    },
  });
}

export async function moverEtapa(user: SessionUser, id: string, etapa: EtapaOportunidad) {
  const existing = await prisma.oportunidad.findFirst({ where: { id, deletedAt: null, ...ownerScope(user) } });
  if (!existing) throw NotFound('Oportunidad');
  const updated = await prisma.oportunidad.update({
    where: { id },
    data: { etapa, probabilidad: PROBABILIDAD_POR_ETAPA[etapa], ...cierreData(etapa, existing.etapa) },
  });
  return serialize(updated);
}

export async function deleteOportunidad(user: SessionUser, id: string) {
  const existing = await prisma.oportunidad.findFirst({ where: { id, deletedAt: null, ...ownerScope(user) } });
  if (!existing) throw NotFound('Oportunidad');
  await prisma.oportunidad.update({ where: { id }, data: { deletedAt: new Date() } });
}
