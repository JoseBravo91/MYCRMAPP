import { describe, expect, it } from 'vitest';
import { clienteSchema, loginSchema, oportunidadSchema, paginationSchema } from '@/lib/validators';

describe('Validadores', () => {
  it('normaliza el email en login', () => {
    expect(loginSchema.parse({ email: '  USER@Mail.CO ', password: 'x' }).email).toBe('user@mail.co');
  });

  it('convierte campos opcionales vacíos en null', () => {
    const c = clienteSchema.parse({ nombre: 'Ana Pérez', email: '', telefono: '', empresa: '' });
    expect(c).toMatchObject({ email: null, telefono: null, empresa: null, estado: 'PROSPECTO', etiquetaIds: [] });
  });

  it('rechaza teléfonos con caracteres no válidos', () => {
    expect(clienteSchema.safeParse({ nombre: 'Ana', telefono: '<script>' }).success).toBe(false);
  });

  it('valida rangos de oportunidad', () => {
    const base = { titulo: 'Venta', valorEstimado: '1000', probabilidad: '50', clienteId: 'cjld2cjxh0000qzrmn831i7rn' };
    expect(oportunidadSchema.safeParse(base).success).toBe(true);
    expect(oportunidadSchema.safeParse({ ...base, probabilidad: 101 }).success).toBe(false);
    expect(oportunidadSchema.safeParse({ ...base, valorEstimado: -1 }).success).toBe(false);
  });

  it('limita el tamaño de página', () => {
    expect(paginationSchema.safeParse({ pageSize: 1000 }).success).toBe(false);
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 10, q: '' });
  });
});
