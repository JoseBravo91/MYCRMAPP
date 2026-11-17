import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Usuario } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { signAccessToken } from './jwt';
import { refreshTtlDays } from './constants';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

interface ClientInfo {
  ip?: string | null;
  userAgent?: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

async function createRefreshToken(usuarioId: string, familyId: string, info: ClientInfo) {
  const refreshToken = randomBytes(48).toString('base64url');
  const refreshExpiresAt = new Date(Date.now() + refreshTtlDays() * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      familyId,
      usuarioId,
      expiresAt: refreshExpiresAt,
      ip: info.ip ?? null,
      userAgent: info.userAgent?.slice(0, 255) ?? null,
    },
  });
  return { refreshToken, refreshExpiresAt };
}

function accessFor(user: Pick<Usuario, 'id' | 'email' | 'nombre' | 'rol'>) {
  return signAccessToken({ sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol });
}

export async function issueTokens(
  user: Pick<Usuario, 'id' | 'email' | 'nombre' | 'rol'>,
  info: ClientInfo,
): Promise<IssuedTokens> {
  const accessToken = await accessFor(user);
  const { refreshToken, refreshExpiresAt } = await createRefreshToken(user.id, randomUUID(), info);
  return { accessToken, refreshToken, refreshExpiresAt };
}

export type RotateResult =
  | { ok: true; tokens: IssuedTokens; usuarioId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'reused' | 'inactive' };

/**
 * Rotación de refresh token: cada uso invalida el token y emite uno nuevo de la misma familia.
 * Si llega un token ya revocado, se asume robo y se revoca la familia completa.
 */
export async function rotateRefreshToken(rawToken: string, info: ClientInfo): Promise<RotateResult> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { usuario: true },
  });
  if (!stored) return { ok: false, reason: 'invalid' };

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: false, reason: 'reused' };
  }
  if (stored.expiresAt < new Date()) return { ok: false, reason: 'expired' };
  if (!stored.usuario.activo) return { ok: false, reason: 'inactive' };

  // updateMany con revokedAt: null hace la revocación atómica ante peticiones concurrentes.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) return { ok: false, reason: 'reused' };

  const accessToken = await accessFor(stored.usuario);
  const { refreshToken, refreshExpiresAt } = await createRefreshToken(stored.usuarioId, stored.familyId, info);
  return { ok: true, usuarioId: stored.usuarioId, tokens: { accessToken, refreshToken, refreshExpiresAt } };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllForUser(usuarioId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { usuarioId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
