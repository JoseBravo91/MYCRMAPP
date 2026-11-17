import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, readJson } from '@/lib/api/handler';
import { seguimientoSchema } from '@/lib/validators';
import { createSeguimiento, listSeguimientos } from '@/lib/services/seguimientos';

const filtrosSchema = z.object({
  clienteId: z.cuid().optional(),
  oportunidadId: z.cuid().optional(),
  pendientes: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const GET = withAuth(async ({ req, user }) => {
  const filtros = filtrosSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return NextResponse.json({ data: await listSeguimientos(user, filtros) });
});

export const POST = withAuth(async ({ req, user }) => {
  const seg = await createSeguimiento(user, seguimientoSchema.parse(await readJson(req)));
  return NextResponse.json(seg, { status: 201 });
});
