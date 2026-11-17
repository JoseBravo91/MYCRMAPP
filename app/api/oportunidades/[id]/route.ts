import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { etapaUpdateSchema, idSchema, oportunidadSchema } from '@/lib/validators';
import { deleteOportunidad, getOportunidad, moverEtapa, updateOportunidad } from '@/lib/services/oportunidades';
import { audit } from '@/lib/audit';

type P = { id: string };

export const GET = withAuth<P>(async ({ user, params }) =>
  NextResponse.json(await getOportunidad(user, idSchema.parse(params.id))),
);

export const PUT = withAuth<P>(async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const op = await updateOportunidad(user, id, oportunidadSchema.parse(await readJson(req)));
  await audit({ usuarioId: user.id, accion: 'OPORTUNIDAD_ACTUALIZADA', entidad: 'Oportunidad', entidadId: id });
  return NextResponse.json({ ...op, valorEstimado: Number(op.valorEstimado) });
});

/** Cambio de etapa desde el pipeline Kanban */
export const PATCH = withAuth<P>(async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const { etapa } = etapaUpdateSchema.parse(await readJson(req));
  const op = await moverEtapa(user, id, etapa);
  await audit({ usuarioId: user.id, accion: 'OPORTUNIDAD_ETAPA', entidad: 'Oportunidad', entidadId: id, metadata: { etapa } });
  return NextResponse.json(op);
});

export const DELETE = withAuth<P>(async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  await deleteOportunidad(user, id);
  await audit({ usuarioId: user.id, accion: 'OPORTUNIDAD_ELIMINADA', entidad: 'Oportunidad', entidadId: id });
  return new NextResponse(null, { status: 204 });
});
