'use client';

import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Card } from '@/components/ui/PageHeader';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, RolBadge } from '@/components/ui/Badge';
import { UsuarioForm, type UsuarioRow } from '@/components/forms/UsuarioForm';
import { formatDateTime } from '@/lib/formatters';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarUploader } from '@/components/ui/AvatarUploader';

type Row = UsuarioRow & { ultimoAcceso: string | null; avatarId: string | null };

export function UsuariosTable({ currentUserId }: { currentUserId: string }) {
  const { data, loading, error, refetch } = useFetch<{ data: Row[] }>('/api/usuarios');
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleActivo(u: Row) {
    setActionError(null);
    try {
      await apiFetch(`/api/usuarios/${u.id}`, { method: 'PATCH', json: { activo: !u.activo } });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo actualizar');
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Equipo</h2>
        <Button size="sm" icon="accion.nuevo" onClick={() => setEditing('new')}>Nuevo usuario</Button>
      </div>
      {(error || actionError) && <div className="p-4"><Alert>{error ?? actionError}</Alert></div>}
      {loading && !data ? (
        <LoadingBlock />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Usuario</th>
                <th scope="col" className="px-4 py-3">Rol</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">Último acceso</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={u.nombre} avatarId={u.avatarId} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{u.nombre}{u.id === currentUserId && <span className="text-xs text-slate-400"> (tú)</span>}</p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                  <td className="px-4 py-3">
                    <Badge className={u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{formatDateTime(u.ultimoAcceso)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>Editar</Button>
                      {u.id !== currentUserId && (
                        <Button size="sm" variant={u.activo ? 'ghost' : 'secondary'} onClick={() => toggleActivo(u)}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}>
        {editing !== null && editing !== 'new' && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <AvatarUploader compact usuarioId={editing.id} nombre={editing.nombre} avatarId={editing.avatarId} onChange={() => refetch()} />
          </div>
        )}
        {editing !== null && (
          <UsuarioForm
            key={editing === 'new' ? 'new' : editing.id}
            usuario={editing === 'new' ? undefined : editing}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
          />
        )}
      </Modal>
    </Card>
  );
}
