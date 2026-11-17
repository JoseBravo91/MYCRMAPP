'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { subirAsset } from '@/lib/upload';
import { Card } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormField';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useToast } from '@/components/ui/Toast';

interface Marca {
  nombre: string;
  logoId: string | null;
  logoUrl: string | null;
  mostrarNombre: boolean;
}

const ASPECTOS = [
  { label: 'Horizontal 3:1', value: 3 },
  { label: 'Panorámico 4:1', value: 4 },
  { label: 'Cuadrado 1:1', value: 1 },
];

export function BrandingEditor({ inicial }: { inicial: Marca }) {
  const router = useRouter();
  const toast = useToast();
  const [marca, setMarca] = useState(inicial);
  const [guardada, setGuardada] = useState(inicial);
  const [cropper, setCropper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const dirty = marca.nombre !== guardada.nombre || marca.mostrarNombre !== guardada.mostrarNombre;

  async function persistir(next: Marca, mensaje: string) {
    const saved = await apiFetch<{ nombre: string; logoId: string | null; mostrarNombre: boolean }>('/api/configuracion/marca', {
      method: 'PUT',
      json: { nombre: next.nombre, logoId: next.logoId, mostrarNombre: next.mostrarNombre },
    });
    const merged = { ...next, ...saved };
    setMarca(merged);
    setGuardada(merged);
    toast(mensaje);
    router.refresh();
  }

  async function guardar() {
    setSaving(true);
    setError(undefined);
    try {
      await persistir(marca, 'Marca actualizada');
    } catch (err) {
      if (err instanceof ApiError) setError(err.details?.nombre?.[0] ?? err.message);
    } finally {
      setSaving(false);
    }
  }

  async function quitarLogo() {
    if (!marca.logoId) return;
    try {
      await apiFetch(`/api/assets/${marca.logoId}`, { method: 'DELETE' });
      const next = { ...guardada, logoId: null, logoUrl: null };
      setMarca(next);
      setGuardada(next);
      toast('Logo eliminado');
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No se pudo quitar el logo', 'error');
    }
  }

  const vista = { nombre: marca.nombre || 'Tu empresa', logoUrl: marca.logoUrl, mostrarNombre: marca.mostrarNombre };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Identidad</h2>
        <p className="text-sm text-slate-500">Nombre y logo que se muestran en el menú, el inicio de sesión y la pestaña del navegador.</p>
      </div>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <Input label="Nombre de la aplicación" name="marca-nombre" maxLength={40} value={marca.nombre} error={error}
            onChange={(e) => setMarca({ ...marca, nombre: e.target.value })} />
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input type="checkbox" checked={marca.mostrarNombre} onChange={(e) => setMarca({ ...marca, mostrarNombre: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[rgb(var(--brand))]" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Mostrar el nombre junto al logo</span>
              <span className="block text-xs text-slate-500">Desactívalo si tu logo ya incluye el nombre.</span>
            </span>
          </label>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Logo</p>
            <p className="mb-3 text-xs text-slate-500">Se recorta a la proporción que elijas y se muestra siempre en un marco de alto fijo.</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-48 items-center justify-center rounded-lg bg-checker p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {marca.logoUrl ? <img src={marca.logoUrl} alt="Logo actual" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-500">Sin logo</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCropper(true)}>{marca.logoUrl ? 'Cambiar logo' : 'Subir logo'}</Button>
                {marca.logoUrl && <Button variant="ghost" onClick={quitarLogo}>Quitar</Button>}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Vista previa</p>
          <div className="rounded-xl bg-brand p-4 text-brand-fg shadow-card">
            <BrandLogo marca={vista} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-brand-ink shadow-card">
            <BrandLogo marca={vista} size="md" />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        {dirty && <span className="text-xs font-medium text-amber-700">Cambios sin guardar</span>}
        <Button variant="secondary" disabled={!dirty || saving} onClick={() => setMarca(guardada)}>Descartar</Button>
        <Button disabled={!dirty} loading={saving} onClick={guardar}>Guardar identidad</Button>
      </div>

      <ImageCropper
        open={cropper}
        onClose={() => setCropper(false)}
        title="Logo de la marca"
        aspects={ASPECTOS}
        outputHeight={160}
        allowZoomOut
        previews={[32, 48]}
        onConfirm={async (blob) => {
          const asset = await subirAsset(blob, 'LOGO', 'logo');
          await persistir({ ...guardada, logoId: asset.id, logoUrl: asset.url }, 'Logo actualizado');
        }}
      />
    </Card>
  );
}
