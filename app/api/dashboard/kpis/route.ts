import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/handler';
import { getKpis } from '@/lib/services/dashboard';

export const GET = withAuth(async ({ user }) => NextResponse.json(await getKpis(user)));
