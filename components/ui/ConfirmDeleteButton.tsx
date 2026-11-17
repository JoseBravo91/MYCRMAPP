'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Modal } from './Modal';
import { Alert } from './Alert';
import { apiFetch, ApiError } from '@/lib/api-client';

interface Props {
  endpoint: string;
  redirectTo: string;
  entidad: string;
  descripcion?: string;
}

export function ConfirmDeleteButton({ endpoint, redirectTo, entidad, descripcion }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(endpoint, { method: 'DELETE' });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar');
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="danger" icon="accion.eliminar" onClick={() => setOpen(true)}>
        Eliminar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Eliminar ${entidad}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {descripcion ?? `¿Seguro que deseas eliminar este ${entidad}? Esta acción lo ocultará del sistema.`}
          </p>
          <Alert>{error}</Alert>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={loading} onClick={confirmar}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
