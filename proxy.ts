import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { ACCESS_COOKIE } from '@/lib/auth/constants';

const PUBLIC_PAGES = ['/login', '/register'];
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout', '/api/auth/sesion-invalida'];
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string, req: NextRequest): boolean {
  return origin === req.nextUrl.origin || allowedOrigins().includes(origin);
}

function withCors(res: NextResponse, origin: string | null, req: NextRequest): NextResponse {
  if (origin && isAllowedOrigin(origin, req)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
  }
  return res;
}

async function handleApi(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (origin && isAllowedOrigin(origin, req)) {
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.headers.set('Access-Control-Max-Age', '600');
    }
    return withCors(res, origin, req);
  }

  // Protección CSRF: las cookies son SameSite, pero además se rechazan escrituras
  // provenientes de orígenes no autorizados.
  if (MUTATING.has(req.method) && origin && !isAllowedOrigin(origin, req)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  // Las imágenes se sirven por GET sin token; el handler exige sesión para los avatares.
  const isPublicAsset = req.method === 'GET' && pathname.startsWith('/api/assets/');

  if (!PUBLIC_API.includes(pathname) && !isPublicAsset) {
    const bearer = req.headers.get('authorization');
    const token = req.cookies.get(ACCESS_COOKIE)?.value ?? (bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined);
    if (!(await verifyAccessToken(token))) {
      return withCors(NextResponse.json({ error: 'No autenticado' }, { status: 401 }), origin, req);
    }
  }

  return withCors(NextResponse.next(), origin, req);
}

async function handlePage(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const session = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  const isPublic = PUBLIC_PAGES.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return session ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  }
  if (session) return NextResponse.next();

  // Access token ausente o vencido: se intenta renovar con el refresh token
  // (que solo viaja a /api/auth) y se vuelve a la página solicitada.
  const refreshUrl = new URL('/api/auth/refresh', req.url);
  refreshUrl.searchParams.set('redirect', `${pathname}${search}`);
  return NextResponse.redirect(refreshUrl);
}

export async function proxy(req: NextRequest) {
  return req.nextUrl.pathname.startsWith('/api/') ? handleApi(req) : handlePage(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
