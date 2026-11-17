export const ACCESS_COOKIE = 'mycrm_at';
export const REFRESH_COOKIE = 'mycrm_rt';

// El refresh token solo viaja a los endpoints de auth, reduciendo su exposición.
export const REFRESH_COOKIE_PATH = '/api/auth';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export function accessTtlSeconds(): number {
  return Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);
}

export function refreshTtlDays(): number {
  return Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);
}
