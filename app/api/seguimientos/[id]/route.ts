import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { idSchema, seguimientoUpdateSchema } from '@/lib/validators';
import { deleteSeguimiento, setCompletado } from '@/lib/services/seguimientos';

type P = { id: string };

export const PATCH = withAuth<P>(async ({ req, user, params }) => {
  const { completado } = seguimientoUpdateSchema.parse(await readJson(req));
  return NextResponse.json(await setCompletado(user, idSchema.parse(params.id), completado));
});

export const DELETE = withAuth<P>(async ({ user, params }) => {
  await deleteSeguimiento(user, idSchema.parse(params.id));
  return new NextResponse(null, { status: 204 });
});
