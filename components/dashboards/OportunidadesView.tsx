'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PipelineKanban } from './PipelineKanban';
import { OportunidadesTable } from '@/components/tables/OportunidadesTable';

type Vista = 'kanban' | 'lista';

export function OportunidadesView({ showOwner }: { showOwner: boolean }) {
  const [vista, setVista] = useLocalStorage<Vista>('oportunidades:vista', 'kanban');

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1" role="tablist" aria-label="Vista">
        {(['kanban', 'lista'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={vista === v}
            onClick={() => setVista(v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${vista === v ? 'bg-brand text-brand-fg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {v === 'kanban' ? 'Pipeline' : 'Lista'}
          </button>
        ))}
      </div>
      {vista === 'kanban' ? <PipelineKanban showOwner={showOwner} /> : <OportunidadesTable showOwner={showOwner} />}
    </div>
  );
}
