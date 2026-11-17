import { describe, expect, it } from 'vitest';
import { can, ownerScope } from '@/lib/auth/rbac';

describe('Roles y permisos', () => {
  it('solo ADMIN gestiona usuarios', () => {
    expect(can('ADMIN', 'usuarios:gestionar')).toBe(true);
    expect(can('GERENTE', 'usuarios:gestionar')).toBe(false);
    expect(can('VENDEDOR', 'usuarios:gestionar')).toBe(false);
  });

  it('GERENTE y ADMIN ven todos los registros; VENDEDOR solo los suyos', () => {
    expect(ownerScope({ id: 'a', rol: 'ADMIN' })).toEqual({});
    expect(ownerScope({ id: 'g', rol: 'GERENTE' })).toEqual({});
    expect(ownerScope({ id: 'v', rol: 'VENDEDOR' })).toEqual({ ownerId: 'v' });
  });

  it('VENDEDOR no puede reasignar registros', () => {
    expect(can('VENDEDOR', 'registros:reasignar')).toBe(false);
    expect(can('GERENTE', 'registros:reasignar')).toBe(true);
  });
});
