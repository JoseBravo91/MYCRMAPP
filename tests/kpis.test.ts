import { describe, expect, it } from 'vitest';
import { tasaConversion, valorPipeline, valorPonderado, valorPorEtapa, ventasPorMes, type OportunidadKpi } from '@/lib/kpis';

const ops: OportunidadKpi[] = [
  { etapa: 'PROSPECTO', valorEstimado: 1000, probabilidad: 10 },
  { etapa: 'COTIZACION', valorEstimado: 2000, probabilidad: 40 },
  { etapa: 'CIERRE', valorEstimado: 4000, probabilidad: 75 },
  { etapa: 'GANADO', valorEstimado: 5000, probabilidad: 100, cerradaEn: new Date(Date.UTC(2026, 10, 5)) },
  { etapa: 'GANADO', valorEstimado: 3000, probabilidad: 100, cerradaEn: new Date(Date.UTC(2026, 9, 10)) },
  { etapa: 'PERDIDO', valorEstimado: 9000, probabilidad: 0, cerradaEn: new Date(Date.UTC(2026, 10, 1)) },
];

describe('Cálculo de KPIs', () => {
  it('tasa de conversión = ganadas / (ganadas + perdidas)', () => {
    expect(tasaConversion(ops)).toBeCloseTo(66.666, 2);
    expect(tasaConversion([])).toBe(0);
    expect(tasaConversion([{ etapa: 'PROSPECTO' }])).toBe(0);
  });

  it('el pipeline solo suma oportunidades abiertas', () => {
    expect(valorPipeline(ops)).toBe(7000);
  });

  it('el valor ponderado aplica la probabilidad', () => {
    expect(valorPonderado(ops)).toBe(100 + 800 + 3000);
  });

  it('agrupa valor y cantidad por etapa', () => {
    const ganado = valorPorEtapa(ops).find((e) => e.etapa === 'GANADO');
    expect(ganado).toEqual({ etapa: 'GANADO', valor: 8000, cantidad: 2 });
  });

  it('agrupa ventas ganadas por mes en una ventana fija', () => {
    const serie = ventasPorMes(ops, 3, new Date(Date.UTC(2026, 10, 16)));
    expect(serie).toHaveLength(3);
    expect(serie.map((s) => s.valor)).toEqual([0, 3000, 5000]);
  });
});
