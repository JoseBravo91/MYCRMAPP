import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Rol } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCESS_COOKIE } from './constants';
import { verifyAccessToken } from './jwt';

export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarId: string | null;
}

/**
 * Obtiene el usuario autenticado a partir del access token (cookie httpOnly o header Bearer).
 * Se consulta la BD para que la desactivación de un usuario o un cambio de rol
 * tengan efecto inmediato y no esperen a que expire el JWT.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  let token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const authHeader = (await headers()).get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
  }

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, avatarId: true },
  });
  if (!user || !user.activo) return null;
  return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, avatarId: user.avatarId };
});

/** Para Server Components: redirige a login si no hay sesión o al dashboard si falta el rol. */
export async function requirePageUser(roles?: Rol[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/api/auth/sesion-invalida');
  if (roles && !roles.includes(user.rol)) redirect('/dashboard');
  return user;
}
