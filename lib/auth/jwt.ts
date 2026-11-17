import { SignJWT, jwtVerify, errors } from 'jose';
import type { Rol } from '@prisma/client';
import { accessTtlSeconds } from './constants';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  nombre: string;
  rol: Rol;
}

const ISSUER = 'mycrmapp';
const AUDIENCE = 'mycrmapp:api';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET no está configurado o tiene menos de 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, nombre: payload.nombre, rol: payload.rol, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${accessTtlSeconds()}s`)
    .sign(getSecret());
}

/** Devuelve el payload si el token es válido; null si es inválido o expiró. */
export async function verifyAccessToken(token: string | undefined | null): Promise<AccessTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      email: String(payload.email),
      nombre: String(payload.nombre),
      rol: payload.rol as Rol,
    };
  } catch (err) {
    if (err instanceof errors.JOSEError) return null;
    throw err;
  }
}
