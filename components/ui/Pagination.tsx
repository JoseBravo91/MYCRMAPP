import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        {total} registro{total === 1 ? '' : 's'} · Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
