import { prisma } from '@/lib/prisma';
import { ownerScope } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { ETAPAS_ABIERTAS, tasaConversion, valorPipeline, valorPonderado, valorPorEtapa, ventasPorMes } from '@/lib/kpis';

function inicioDeMes(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getKpis(user: SessionUser) {
  const scope = ownerScope(user);
  const [totalClientes, clientesNuevosMes, seguimientosPendientes, ops] = await Promise.all([
    prisma.cliente.count({ where: { deletedAt: null, ...scope } }),
    prisma.cliente.count({
      where: { deletedAt: null, ...scope, createdAt: { gte: inicioDeMes() } },
    }),
    prisma.seguimiento.count({ where: { completado: false, cliente: { deletedAt: null, ...scope } } }),
    prisma.oportunidad.findMany({
      where: { deletedAt: null, ...scope },
      select: { etapa: true, valorEstimado: true, probabilidad: true, cerradaEn: true },
    }),
  ]);

  const oportunidades = ops.map((o) => ({ ...o, valorEstimado: Number(o.valorEstimado) }));

  return {
    totalClientes,
    clientesNuevosMes,
    seguimientosPendientes,
    oportunidadesAbiertas: oportunidades.filter((o) => ETAPAS_ABIERTAS.includes(o.etapa)).length,
    valorPipeline: valorPipeline(oportunidades),
    valorPonderado: valorPonderado(oportunidades),
    tasaConversion: tasaConversion(oportunidades),
    porEtapa: valorPorEtapa(oportunidades),
    ventasPorMes: ventasPorMes(oportunidades),
  };
}

export type Kpis = Awaited<ReturnType<typeof getKpis>>;
