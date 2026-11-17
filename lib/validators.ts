import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Correo electrónico inválido').max(160));

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres') // límite efectivo de bcrypt
  .regex(/[a-z]/, 'Debe contener una minúscula')
  .regex(/[A-Z]/, 'Debe contener una mayúscula')
  .regex(/\d/, 'Debe contener un número');

export const rolSchema = z.enum(['ADMIN', 'GERENTE', 'VENDEDOR']);

// ---------- Autenticación ----------
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria').max(72),
});

export const registerSchema = z.object({
  nombre: trimmed(120).min(2, 'Mínimo 2 caracteres'),
  email: emailSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    actual: z.string().min(1).max(72),
    nueva: passwordSchema,
  })
  .refine((d) => d.actual !== d.nueva, { message: 'La nueva contraseña debe ser distinta', path: ['nueva'] });

// ---------- Usuarios (admin) ----------
export const usuarioCreateSchema = registerSchema.extend({ rol: rolSchema });

export const usuarioUpdateSchema = z
  .object({
    nombre: trimmed(120).min(2).optional(),
    rol: rolSchema.optional(),
    activo: z.boolean().optional(),
    password: passwordSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Sin cambios' });

// ---------- Clientes ----------
export const estadoClienteSchema = z.enum(['PROSPECTO', 'ACTIVO', 'INACTIVO']);

export const clienteSchema = z.object({
  nombre: trimmed(120).min(2, 'Mínimo 2 caracteres'),
  email: z
    .union([emailSchema, z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  telefono: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-()\s]*$/, 'Teléfono inválido')
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  empresa: optionalText(120),
  industria: optionalText(80),
  ciudad: optionalText(80),
  notas: optionalText(5000),
  estado: estadoClienteSchema.default('PROSPECTO'),
  etiquetaIds: z.array(z.cuid()).max(20).default([]),
  ownerId: z.cuid().optional(),
});

// ---------- Oportunidades ----------
export const ETAPAS = ['PROSPECTO', 'COTIZACION', 'CIERRE', 'GANADO', 'PERDIDO'] as const;
export const etapaSchema = z.enum(ETAPAS);

const fechaOpcional = z
  .union([z.iso.date(), z.literal('')])
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));

export const oportunidadSchema = z.object({
  titulo: trimmed(160).min(3, 'Mínimo 3 caracteres'),
  descripcion: optionalText(5000),
  valorEstimado: z.coerce.number().min(0, 'Debe ser positivo').max(999_999_999_999),
  probabilidad: z.coerce.number().int().min(0).max(100),
  etapa: etapaSchema.default('PROSPECTO'),
  fechaCierreEstimada: fechaOpcional,
  clienteId: z.cuid('Cliente inválido'),
  ownerId: z.cuid().optional(),
});

export const etapaUpdateSchema = z.object({ etapa: etapaSchema });

// ---------- Seguimientos ----------
export const seguimientoSchema = z.object({
  tipo: z.enum(['TAREA', 'LLAMADA', 'EMAIL', 'REUNION']),
  asunto: trimmed(160).min(3, 'Mínimo 3 caracteres'),
  descripcion: optionalText(5000),
  fechaProgramada: z
    .union([z.iso.datetime({ local: true, offset: true }), z.iso.date(), z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  clienteId: z.cuid(),
  oportunidadId: z
    .union([z.cuid(), z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export const seguimientoUpdateSchema = z.object({ completado: z.boolean() });

// ---------- Utilidades ----------
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional().default(''),
});

export const idSchema = z.cuid();

export const analizarSchema = z.object({ clienteId: z.cuid() });
