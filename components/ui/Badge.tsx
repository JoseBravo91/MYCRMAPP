import type { EtapaOportunidad, EstadoCliente, Rol } from '@prisma/client';
import { ESTADO_CLIENTE_LABEL, ETAPA_LABEL } from '@/lib/formatters';
import { ROL_LABEL } from '@/lib/auth/rbac';

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export const ETAPA_STYLE: Record<EtapaOportunidad, string> = {
  PROSPECTO: 'bg-slate-100 text-slate-700',
  COTIZACION: 'bg-brand-light text-brand-ink',
  CIERRE: 'bg-accent-light text-accent-ink',
  GANADO: 'bg-green-100 text-green-700',
  PERDIDO: 'bg-red-100 text-red-700',
};

export function EtapaBadge({ etapa }: { etapa: EtapaOportunidad }) {
  return <Badge className={ETAPA_STYLE[etapa]}>{ETAPA_LABEL[etapa]}</Badge>;
}

const ESTADO_STYLE: Record<EstadoCliente, string> = {
  PROSPECTO: 'bg-accent-light text-accent-ink',
  ACTIVO: 'bg-green-100 text-green-700',
  INACTIVO: 'bg-slate-100 text-slate-600',
};

export function EstadoBadge({ estado }: { estado: EstadoCliente }) {
  return <Badge className={ESTADO_STYLE[estado]}>{ESTADO_CLIENTE_LABEL[estado]}</Badge>;
}

const ROL_STYLE: Record<Rol, string> = {
  ADMIN: 'bg-brand text-brand-fg',
  GERENTE: 'bg-accent text-accent-fg',
  VENDEDOR: 'bg-slate-100 text-slate-700',
};

export function RolBadge({ rol }: { rol: Rol }) {
  return <Badge className={ROL_STYLE[rol]}>{ROL_LABEL[rol]}</Badge>;
}
