import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { passwordSchema } from '@/lib/validators';

describe('Contraseñas', () => {
  it('no almacena texto plano y verifica correctamente', async () => {
    const hash = await hashPassword('Segura123');
    expect(hash).not.toContain('Segura123');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyPassword('Segura123', hash)).toBe(true);
    expect(await verifyPassword('segura123', hash)).toBe(false);
  });

  it('devuelve false cuando el usuario no existe (hash nulo)', async () => {
    expect(await verifyPassword('cualquiera', null)).toBe(false);
  });

  it('aplica la política de complejidad', () => {
    expect(passwordSchema.safeParse('corta1A').success).toBe(false);
    expect(passwordSchema.safeParse('sinmayuscula1').success).toBe(false);
    expect(passwordSchema.safeParse('SINMINUSCULA1').success).toBe(false);
    expect(passwordSchema.safeParse('SinNumeroAqui').success).toBe(false);
    expect(passwordSchema.safeParse('Valida123').success).toBe(true);
  });
});
