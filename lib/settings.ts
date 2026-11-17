import { cache } from 'react';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HEX_RE, TEMA_POR_DEFECTO, type Tema } from '@/lib/theme';
import { SLOT_KEYS } from '@/lib/icon-slots';

export const temaSchema = z.object({
  primario: z.string().regex(HEX_RE, 'Color inválido'),
  acento: z.string().regex(HEX_RE, 'Color inválido'),
});

export const marcaSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(40),
  logoId: z.cuid().nullable(),
  /** Mostrar el nombre junto al logo (desactivar si el logo ya incluye el nombre) */
  mostrarNombre: z.boolean().default(true),
});

export const iconosSchema = z
  .record(z.string(), z.cuid())
  .refine((m) => Object.keys(m).every((k) => SLOT_KEYS.has(k)), 'Ubicación de icono desconocida');

export type Marca = z.infer<typeof marcaSchema>;
export type IconosAsignados = Record<string, string>;

export const MARCA_POR_DEFECTO: Marca = { nombre: 'MyCrmApp', logoId: null, mostrarNombre: true };

export interface AppSettings {
  tema: Tema;
  marca: Marca;
  iconos: IconosAsignados;
}

function parse<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const r = schema.safeParse(value);
  return r.success ? r.data : fallback;
}

/** Configuración global, consultada una vez por petición. */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  const rows = await prisma.configuracion.findMany();
  const get = (clave: string) => rows.find((r) => r.clave === clave)?.valor;
  return {
    tema: parse(temaSchema, get('tema'), TEMA_POR_DEFECTO),
    marca: parse(marcaSchema, get('marca'), MARCA_POR_DEFECTO),
    iconos: parse(iconosSchema, get('iconos'), {}),
  };
});

export async function guardarConfiguracion(clave: 'tema' | 'marca' | 'iconos', valor: Prisma.InputJsonValue, usuarioId: string) {
  await prisma.configuracion.upsert({
    where: { clave },
    create: { clave, valor, actualizadoPor: usuarioId },
    update: { valor, actualizadoPor: usuarioId },
  });
}
