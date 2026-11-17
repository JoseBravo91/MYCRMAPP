/**
 * Limitador de ventana deslizante en memoria.
 * Suficiente para una sola instancia; con varias réplicas debe moverse a Redis o similar.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      return { allowed: false, remaining: 0, retryAfterMs: timestamps[0] + this.windowMs - now };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    if (this.hits.size > 10_000) this.prune(windowStart);
    return { allowed: true, remaining: this.limit - timestamps.length, retryAfterMs: 0 };
  }

  reset(key: string): void {
    this.hits.delete(key);
  }

  private prune(windowStart: number): void {
    for (const [key, ts] of this.hits) {
      if (ts.every((t) => t <= windowStart)) this.hits.delete(key);
    }
  }
}

// Instancias compartidas por el proceso
export const loginLimiter = new RateLimiter(10, 15 * 60 * 1000);
export const registerLimiter = new RateLimiter(5, 60 * 60 * 1000);
export const geminiGlobalLimiter = new RateLimiter(60, 60 * 1000);
export const geminiUserLimiter = new RateLimiter(10, 60 * 1000);
export const uploadLimiter = new RateLimiter(30, 60 * 1000);
