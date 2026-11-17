import type { EtapaOportunidad } from '@prisma/client';

export const ETAPAS_ABIERTAS: EtapaOportunidad[] = ['PROSPECTO', 'COTIZACION', 'CIERRE'];

export interface OportunidadKpi {
  etapa: EtapaOportunidad;
  valorEstimado: number;
  probabilidad: number;
  cerradaEn?: Date | null;
}

export function isAbierta(etapa: EtapaOportunidad): boolean {
  return ETAPAS_ABIERTAS.includes(etapa);
}

/** Tasa de conversión = ganadas / (ganadas + perdidas). Solo cuentan negocios cerrados. */
export function tasaConversion(ops: Pick<OportunidadKpi, 'etapa'>[]): number {
  const ganadas = ops.filter((o) => o.etapa === 'GANADO').length;
  const perdidas = ops.filter((o) => o.etapa === 'PERDIDO').length;
  const cerradas = ganadas + perdidas;
  return cerradas === 0 ? 0 : (ganadas / cerradas) * 100;
}

export function valorPipeline(ops: OportunidadKpi[]): number {
  return ops.filter((o) => isAbierta(o.etapa)).reduce((sum, o) => sum + o.valorEstimado, 0);
}

/** Valor ponderado por probabilidad: estimación realista de ingresos del pipeline. */
export function valorPonderado(ops: OportunidadKpi[]): number {
  return ops
    .filter((o) => isAbierta(o.etapa))
    .reduce((sum, o) => sum + (o.valorEstimado * o.probabilidad) / 100, 0);
}

export function valorPorEtapa(ops: OportunidadKpi[]): { etapa: EtapaOportunidad; valor: number; cantidad: number }[] {
  const etapas: EtapaOportunidad[] = ['PROSPECTO', 'COTIZACION', 'CIERRE', 'GANADO', 'PERDIDO'];
  return etapas.map((etapa) => {
    const deEtapa = ops.filter((o) => o.etapa === etapa);
    return { etapa, cantidad: deEtapa.length, valor: deEtapa.reduce((s, o) => s + o.valorEstimado, 0) };
  });
}

/** Ventas ganadas agrupadas por mes (últimos `meses` meses, incluyendo el actual). */
export function ventasPorMes(ops: OportunidadKpi[], meses = 6, ahora = new Date()): { mes: string; valor: number }[] {
  const buckets: { key: string; mes: string; valor: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - i, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
      mes: new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' }).format(d),
      valor: 0,
    });
  }
  for (const o of ops) {
    if (o.etapa !== 'GANADO' || !o.cerradaEn) continue;
    const c = new Date(o.cerradaEn);
    const bucket = buckets.find((b) => b.key === `${c.getUTCFullYear()}-${c.getUTCMonth()}`);
    if (bucket) bucket.valor += o.valorEstimado;
  }
  return buckets.map(({ mes, valor }) => ({ mes, valor }));
}

/** Probabilidad sugerida al mover una oportunidad de etapa en el pipeline. */
export const PROBABILIDAD_POR_ETAPA: Record<EtapaOportunidad, number> = {
  PROSPECTO: 10,
  COTIZACION: 40,
  CIERRE: 75,
  GANADO: 100,
  PERDIDO: 0,
};
