import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { Prisma, type Rol } from '@prisma/client';
import { AppError } from '@/lib/errors';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

type RouteParams = Record<string, string>;

interface HandlerContext<P extends RouteParams> {
  req: NextRequest;
  user: SessionUser;
  params: P;
}

interface Options {
  roles?: Rol[];
}

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

export function toErrorResponse(err: unknown) {
  if (err instanceof AppError) return jsonError(err.status, err.message, err.details);
  if (err instanceof ZodError) return jsonError(400, 'Datos inválidos', z.flattenError(err).fieldErrors);
  if (err instanceof SyntaxError) return jsonError(400, 'JSON mal formado');
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return jsonError(409, 'Ya existe un registro con esos datos');
    if (err.code === 'P2025') return jsonError(404, 'Recurso no encontrado');
  }
  // Nunca se exponen detalles internos al cliente
  console.error('[api] error no controlado', err);
  return jsonError(500, 'Error interno del servidor');
}

/**
 * Envoltorio para route handlers protegidos: autentica, autoriza por rol
 * y centraliza el manejo de errores.
 */
export function withAuth<P extends RouteParams = RouteParams>(
  handler: (ctx: HandlerContext<P>) => Promise<Response>,
  options: Options = {},
) {
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    try {
      const user = await getSessionUser();
      if (!user) return jsonError(401, 'No autenticado');
      if (options.roles && !options.roles.includes(user.rol)) {
        return jsonError(403, 'No tienes permisos para realizar esta acción');
      }
      const params = context?.params ? await context.params : ({} as P);
      return await handler({ req, user, params });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function withErrors(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function readJson(req: NextRequest): Promise<unknown> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AppError(415, 'Content-Type debe ser application/json');
  }
  return req.json();
}
