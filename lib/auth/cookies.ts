import type { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_COOKIE_PATH, accessTtlSeconds } from './constants';
import type { IssuedTokens } from './tokens';

const secure = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: NextResponse, tokens: IssuedTokens): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessTtlSeconds(),
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    expires: tokens.refreshExpiresAt,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
}
