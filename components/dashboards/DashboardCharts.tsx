'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EtapaOportunidad } from '@prisma/client';
import { ETAPA_LABEL, formatCOP, formatCompact } from '@/lib/formatters';
import { useSettings } from '@/components/providers/SettingsProvider';

function coloresEtapa(primario: string, acento: string): Record<EtapaOportunidad, string> {
  return { PROSPECTO: '#94A3B8', COTIZACION: primario, CIERRE: acento, GANADO: '#16A34A', PERDIDO: '#DC2626' };
}

interface Props {
  porEtapa: { etapa: EtapaOportunidad; valor: number; cantidad: number }[];
  ventasPorMes: { mes: string; valor: number }[];
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="mb-4 text-xs text-slate-500">{subtitle}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function DashboardCharts({ porEtapa, ventasPorMes }: Props) {
  const { tema } = useSettings();
  const ETAPA_COLOR = coloresEtapa(tema.primario, tema.acento);
  const etapas = porEtapa.map((e) => ({ ...e, nombre: ETAPA_LABEL[e.etapa] }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Valor por etapa" subtitle="Suma del valor estimado de las oportunidades en cada etapa">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={etapas} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(v, _n, item) => [`${formatCOP(Number(v))} (${item.payload.cantidad})`, 'Valor']}
              cursor={{ fill: '#F1F5F9' }}
            />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {etapas.map((e) => (
                <Cell key={e.etapa} fill={ETAPA_COLOR[e.etapa]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Ventas ganadas" subtitle="Valor de oportunidades ganadas por mes (últimos 6 meses)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ventasPorMes} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip formatter={(v) => [formatCOP(Number(v)), 'Ventas']} cursor={{ fill: '#F1F5F9' }} />
            <Bar dataKey="valor" fill={tema.primario} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
