import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { etapaSchema, oportunidadSchema, paginationSchema } from '@/lib/validators';
import { createOportunidad, listOportunidades, listPipeline } from '@/lib/services/oportunidades';
import { audit } from '@/lib/audit';

export const GET = withAuth(async ({ req, user }) => {
  const params = req.nextUrl.searchParams;
  if (params.get('vista') === 'pipeline') return NextResponse.json({ data: await listPipeline(user) });

  const opts = paginationSchema.parse({
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
    q: params.get('q') ?? undefined,
  });
  const etapa = params.get('etapa') ? etapaSchema.parse(params.get('etapa')) : undefined;
  return NextResponse.json(await listOportunidades(user, { ...opts, etapa }));
});

export const POST = withAuth(async ({ req, user }) => {
  const op = await createOportunidad(user, oportunidadSchema.parse(await readJson(req)));
  await audit({ usuarioId: user.id, accion: 'OPORTUNIDAD_CREADA', entidad: 'Oportunidad', entidadId: op.id });
  return NextResponse.json({ ...op, valorEstimado: Number(op.valorEstimado) }, { status: 201 });
});
