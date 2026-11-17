import { describe, expect, it } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  it('bloquea al superar el límite dentro de la ventana', () => {
    const rl = new RateLimiter(3, 1000);
    const t = 10_000;
    expect(rl.check('k', t).allowed).toBe(true);
    expect(rl.check('k', t + 1).allowed).toBe(true);
    expect(rl.check('k', t + 2).allowed).toBe(true);
    const blocked = rl.check('k', t + 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(997);
  });

  it('libera cupo cuando pasa la ventana y aísla claves', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.check('a', 0).allowed).toBe(true);
    expect(rl.check('b', 0).allowed).toBe(true);
    expect(rl.check('a', 500).allowed).toBe(false);
    expect(rl.check('a', 1001).allowed).toBe(true);
  });

  it('reset limpia el historial de una clave', () => {
    const rl = new RateLimiter(1, 1000);
    rl.check('x', 0);
    rl.reset('x');
    expect(rl.check('x', 1).allowed).toBe(true);
  });
});
