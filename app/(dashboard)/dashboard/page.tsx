import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { getKpis } from '@/lib/services/dashboard';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { KPIsCard } from '@/components/dashboards/KPIsCard';
import { DashboardCharts } from '@/components/dashboards/DashboardCharts';
import { SeguimientosTable } from '@/components/tables/SeguimientosTable';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requirePageUser();
  const kpis = await getKpis(user);
  const alcance = user.rol === 'VENDEDOR' ? 'tus registros' : 'todo el equipo';

  return (
    <>
      <PageHeader
        title={`Hola, ${user.nombre.split(' ')[0]}`}
        subtitle={`Resumen comercial de ${alcance}`}
        actions={
          <LinkButton href="/oportunidades">Ver pipeline</LinkButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPIsCard icon="kpi.clientes" label="Total clientes" value={String(kpis.totalClientes)} hint={`${kpis.clientesNuevosMes} nuevos este mes`} />
        <KPIsCard icon="kpi.pipeline" label="Valor del pipeline" value={formatCOP(kpis.valorPipeline)} hint={`Ponderado: ${formatCOP(kpis.valorPonderado)}`} accent="accent" />
        <KPIsCard icon="kpi.abiertas" label="Oportunidades abiertas" value={String(kpis.oportunidadesAbiertas)} hint="Prospecto, cotización y cierre" />
        <KPIsCard icon="kpi.conversion" label="Tasa de conversión" value={formatPercent(kpis.tasaConversion)} hint="Ganadas / cerradas" accent="green" />
        <KPIsCard icon="kpi.seguimientos" label="Seguimientos pendientes" value={String(kpis.seguimientosPendientes)} accent="slate" />
      </div>
      <div className="mt-6">
        <DashboardCharts porEtapa={kpis.porEtapa} ventasPorMes={kpis.ventasPorMes} />
      </div>
      <div className="mt-6">
        <SeguimientosTable title="Próximos seguimientos" />
      </div>
    </>
  );
}
