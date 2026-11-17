'use client';

import { Button } from '@/components/ui/Button';

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-lg font-semibold text-slate-900">Algo salió mal</p>
      <p className="text-sm text-slate-500">Ocurrió un error inesperado al cargar esta sección.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
