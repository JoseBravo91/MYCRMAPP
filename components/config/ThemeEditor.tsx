'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { HEX_RE, PRESETS, TEMA_POR_DEFECTO, contraste, paleta, variablesCss, type Tema } from '@/lib/theme';
import { Card } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

function ContrasteInfo({ hex }: { hex: string }) {
  const p = paleta(hex);
  const ratio = contraste(hex, p.texto);
  const ok = ratio >= 4.5;
  return (
    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <span className="inline-flex h-6 w-10 items-center justify-center rounded text-[11px] font-bold" style={{ backgroundColor: p.base, color: p.texto }}>
          Aa
        </span>
        <div>
          <dt className="text-slate-500">Texto sobre el color</dt>
          <dd className={`font-semibold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
            {ratio.toFixed(1)}:1 · {ok ? 'Cumple AA' : 'Contraste bajo'}
          </dd>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <span className="inline-flex h-6 w-10 items-center justify-center rounded border border-slate-200 bg-white text-[11px] font-bold" style={{ color: p.tinta }}>
          Aa
        </span>
        <div>
          <dt className="text-slate-500">Enlaces y textos</dt>
          <dd className="font-semibold text-slate-700">{p.tinta === p.base ? 'Usa el mismo color' : `Oscurecido a ${p.tinta}`}</dd>
        </div>
      </div>
    </dl>
  );
}

function ColorField({ id, label, descripcion, value, onChange }: { id: string; label: string; descripcion: string; value: string; onChange: (v: string) => void }) {
  const [texto, setTexto] = useState(value);
  const [prev, setPrev] = useState(value);
  // Sincroniza el campo de texto cuando el color cambia desde un preset o el selector
  if (prev !== value) {
    setPrev(value);
    setTexto(value);
  }
  const invalido = !HEX_RE.test(texto);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{descripcion}</p>
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor={`${id}-picker`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-inset ring-slate-900/10" style={{ backgroundColor: value }}>
          <span className="sr-only">Elegir {label.toLowerCase()}</span>
          <input id={`${id}-picker`} type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <div className="flex-1">
          <label htmlFor={`${id}-hex`} className="sr-only">Código hexadecimal</label>
          <input
            id={`${id}-hex`}
            value={texto}
            maxLength={7}
            spellCheck={false}
            aria-invalid={invalido}
            onChange={(e) => {
              const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
              setTexto(v.toUpperCase());
              if (HEX_RE.test(v)) onChange(v.toUpperCase());
            }}
            className={`h-11 w-full rounded-lg border px-3 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/25 ${
              invalido ? 'border-red-400' : 'border-slate-300 focus:border-brand'
            }`}
          />
          {invalido && <p className="mt-1 text-xs text-red-600">Usa el formato #RRGGBB</p>}
        </div>
      </div>
      <ContrasteInfo hex={value} />
    </div>
  );
}

/** Mini aplicación renderizada con el tema en edición (variables CSS aplicadas solo a este bloque). */
function Preview({ tema }: { tema: Tema }) {
  return (
    <div style={variablesCss(tema) as CSSProperties} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-card">
      <div className="flex h-[340px]">
        <div className="flex w-36 shrink-0 flex-col gap-1 bg-brand p-3 text-brand-fg">
          <p className="mb-3 truncate text-sm font-extrabold">Tu empresa</p>
          {['Dashboard', 'Clientes', 'Oportunidades'].map((l, i) => (
            <span key={l} className={`relative rounded-md px-2 py-1.5 text-xs ${i === 1 ? 'bg-brand-fg/15 font-semibold' : 'opacity-75'}`}>
              {i === 1 && <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" />}
              {l}
            </span>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-slate-900">Clientes</p>
            <span className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-brand-fg">Nuevo cliente</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-brand" />
              <p className="text-[10px] text-slate-500">Pipeline</p>
              <p className="text-sm font-extrabold text-slate-900">$158,9 M</p>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
              <p className="text-[10px] text-slate-500">Conversión</p>
              <p className="text-sm font-extrabold text-slate-900">71,4%</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex h-16 items-end gap-2">
              {[40, 65, 90, 55, 75].map((h, i) => (
                <span key={i} className={`flex-1 rounded-t ${i % 2 ? 'bg-accent' : 'bg-brand'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand-ink">Cotización</span>
            <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold text-accent-ink">Cierre</span>
            <span className="text-xs font-semibold text-brand-ink underline">Ver detalle</span>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">Analizar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeEditor({ inicial }: { inicial: Tema }) {
  const router = useRouter();
  const toast = useToast();
  const [guardado, setGuardado] = useState(inicial);
  const [tema, setTema] = useState(inicial);
  const [saving, setSaving] = useState(false);
  const dirty = tema.primario !== guardado.primario || tema.acento !== guardado.acento;

  async function guardar() {
    setSaving(true);
    try {
      const nuevo = await apiFetch<Tema>('/api/configuracion/tema', { method: 'PUT', json: tema });
      setGuardado(nuevo);
      toast('Colores actualizados para toda la aplicación');
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Colores de la marca</h2>
        <p className="text-sm text-slate-500">
          El color principal se usa en el menú, botones y enlaces; el de acento en indicadores y llamados a la acción. Los textos se ajustan solos para mantenerse legibles.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Combinaciones sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const sel = p.tema.primario === tema.primario && p.tema.acento === tema.acento;
                return (
                  <button
                    key={p.nombre}
                    type="button"
                    onClick={() => setTema(p.tema)}
                    aria-pressed={sel}
                    className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-semibold transition-colors ${
                      sel ? 'border-brand bg-brand-light text-brand-ink' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex -space-x-1.5" aria-hidden="true">
                      <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: p.tema.primario }} />
                      <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: p.tema.acento }} />
                    </span>
                    {p.nombre}
                  </button>
                );
              })}
            </div>
          </div>
          <ColorField id="primario" label="Color principal" descripcion="Color maestro de la herramienta" value={tema.primario} onChange={(primario) => setTema((t) => ({ ...t, primario }))} />
          <ColorField id="acento" label="Color de acento" descripcion="Resalta acciones y elementos activos" value={tema.acento} onChange={(acento) => setTema((t) => ({ ...t, acento }))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Vista previa en vivo</p>
          <Preview tema={tema} />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => setTema(TEMA_POR_DEFECTO)}>
          Restablecer colores UNAD
        </Button>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-amber-700">Cambios sin guardar</span>}
          <Button variant="secondary" disabled={!dirty || saving} onClick={() => setTema(guardado)}>
            Descartar
          </Button>
          <Button disabled={!dirty} loading={saving} onClick={guardar}>
            Guardar colores
          </Button>
        </div>
      </div>
    </Card>
  );
}
