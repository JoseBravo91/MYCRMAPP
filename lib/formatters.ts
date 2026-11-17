const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCOP(value: number | string | null | undefined): string {
  return copFormatter.format(Number(value ?? 0));
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** yyyy-mm-dd para inputs type="date" */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export const ETAPA_LABEL = {
  PROSPECTO: 'Prospecto',
  COTIZACION: 'Cotización',
  CIERRE: 'Cierre',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
} as const;

export const ESTADO_CLIENTE_LABEL = {
  PROSPECTO: 'Prospecto',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
} as const;

export const TIPO_SEGUIMIENTO_LABEL = {
  TAREA: 'Tarea',
  LLAMADA: 'Llamada',
  EMAIL: 'Email',
  REUNION: 'Reunión',
} as const;
