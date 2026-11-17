import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/handler';

export const GET = withAuth(async () =>
  NextResponse.json({ data: await prisma.etiqueta.findMany({ orderBy: { nombre: 'asc' } }) }),
);
