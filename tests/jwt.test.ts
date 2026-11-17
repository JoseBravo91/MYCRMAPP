import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { signAccessToken, verifyAccessToken } from '@/lib/auth/jwt';

const payload = { sub: 'user_1', email: 'a@b.co', nombre: 'Ana', rol: 'VENDEDOR' as const };

describe('JWT de acceso', () => {
  it('firma y verifica un token válido', async () => {
    const token = await signAccessToken(payload);
    expect(await verifyAccessToken(token)).toEqual(payload);
  });

  it('rechaza tokens manipulados', async () => {
    const token = await signAccessToken(payload);
    const [h, p, s] = token.split('.');
    const tampered = JSON.parse(Buffer.from(p, 'base64url').toString());
    tampered.rol = 'ADMIN';
    const forged = [h, Buffer.from(JSON.stringify(tampered)).toString('base64url'), s].join('.');
    expect(await verifyAccessToken(forged)).toBeNull();
  });

  it('rechaza tokens firmados con otro secreto', async () => {
    const otro = await new SignJWT({ typ: 'access', rol: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('x')
      .setIssuer('mycrmapp')
      .setAudience('mycrmapp:api')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode('otro-secreto-de-al-menos-32-caracteres!!'));
    expect(await verifyAccessToken(otro)).toBeNull();
  });

  it('rechaza tokens expirados', async () => {
    const expired = await new SignJWT({ typ: 'access', email: 'a@b.co', nombre: 'Ana', rol: 'VENDEDOR' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user_1')
      .setIssuer('mycrmapp')
      .setAudience('mycrmapp:api')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    expect(await verifyAccessToken(expired)).toBeNull();
  });

  it('rechaza el algoritmo "none" y valores vacíos', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'x', typ: 'access' })).toString('base64url');
    expect(await verifyAccessToken(`${header}.${body}.`)).toBeNull();
    expect(await verifyAccessToken('')).toBeNull();
    expect(await verifyAccessToken(undefined)).toBeNull();
  });
});
