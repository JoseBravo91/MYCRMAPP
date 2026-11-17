import type { Rol } from '@prisma/client';

export const ROLES: readonly Rol[] = ['ADMIN', 'GERENTE', 'VENDEDOR'] as const;

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  VENDEDOR: 'Vendedor',
};

export type Permiso =
  | 'usuarios:gestionar'
  | 'registros:ver_todos'
  | 'registros:reasignar'
  | 'auditoria:ver';

const PERMISOS: Record<Rol, readonly Permiso[]> = {
  ADMIN: ['usuarios:gestionar', 'registros:ver_todos', 'registros:reasignar', 'auditoria:ver'],
  GERENTE: ['registros:ver_todos', 'registros:reasignar'],
  VENDEDOR: [],
};

export function can(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS[rol].includes(permiso);
}

/**
 * Filtro de propiedad para consultas Prisma: un vendedor solo accede a sus registros,
 * gerentes y administradores ven los de todo el equipo.
 */
export function ownerScope(user: { id: string; rol: Rol }): { ownerId?: string } {
  return can(user.rol, 'registros:ver_todos') ? {} : { ownerId: user.id };
}
