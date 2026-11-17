'use client';

import { useState, type ReactNode } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { LoadingBlock } from '@/components/ui/Spinner';

interface Resultado {
  fuente: 'gemini' | 'fallback';
  contenido: string;
  modelo?: string;
  motivoFallback?: string;
}

// Renderizado mínimo de Markdown a elementos React: evita dangerouslySetInnerHTML
// y por tanto cualquier XSS a partir de la respuesta del modelo.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={blocks.length} className={`ml-5 space-y-1 ${list.ordered ? 'list-decimal' : 'list-disc'}`}>
        {list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const numbered = line.match(/^\d+[.)]\s+(.*)/);
    if (bullet || numbered) {
      const ordered = !!numbered && !bullet;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,4}\s+(.*)/);
    blocks.push(
      heading ? (
        <h3 key={blocks.length} className="mt-2 font-semibold text-brand-ink">{inline(heading[1])}</h3>
      ) : (
        <p key={blocks.length}>{inline(line)}</p>
      ),
    );
  }
  flush();
  return <div className="space-y-3 text-sm leading-relaxed text-slate-700">{blocks}</div>;
}

export function GeminiAnalysis({ clienteId, clienteNombre }: { clienteId: string; clienteNombre: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function analizar() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      setResultado(await apiFetch<Resultado>('/api/gemini/analizar', { method: 'POST', json: { clienteId } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el análisis');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="accent" icon="accion.ia" onClick={analizar}>
        Analizar con IA
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Estrategia sugerida · ${clienteNombre}`} size="lg">
        {loading ? (
          <LoadingBlock label="Analizando cliente…" />
        ) : error ? (
          <div className="space-y-4">
            <Alert>{error}</Alert>
            <Button variant="secondary" onClick={analizar}>Reintentar</Button>
          </div>
        ) : (
          resultado && (
            <div className="space-y-4">
              {resultado.fuente === 'fallback' && (
                <Alert type="warning">
                  Análisis generado con reglas locales ({resultado.motivoFallback}). Configura GEMINI_API_KEY para usar IA.
                </Alert>
              )}
              <MarkdownLite text={resultado.contenido} />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-400">
                <span>{resultado.fuente === 'gemini' ? `Generado por ${resultado.modelo}` : 'Motor de reglas local'}</span>
                <Button size="sm" variant="secondary" onClick={analizar}>Regenerar</Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </>
  );
}
