/**
 * Generación del tema a partir de dos colores maestros.
 * De cada color se derivan variantes (hover, fondo suave) y colores de texto
 * que garantizan contraste WCAG AA, para que el cliente pueda elegir cualquier color
 * sin romper la legibilidad.
 */

export interface Tema {
  primario: string;
  acento: string;
}

export const TEMA_POR_DEFECTO: Tema = { primario: '#0033A0', acento: '#FF6600' };

export const PRESETS: { nombre: string; tema: Tema }[] = [
  { nombre: 'UNAD', tema: { primario: '#0033A0', acento: '#FF6600' } },
  { nombre: 'Océano', tema: { primario: '#0E7490', acento: '#F59E0B' } },
  { nombre: 'Esmeralda', tema: { primario: '#047857', acento: '#2563EB' } },
  { nombre: 'Índigo', tema: { primario: '#4338CA', acento: '#DB2777' } },
  { nombre: 'Grafito', tema: { primario: '#1E293B', acento: '#10B981' } },
  { nombre: 'Vino', tema: { primario: '#9F1239', acento: '#CA8A04' } },
];

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as RGB);
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BLANCO = '#FFFFFF';
const TINTA = '#0F172A';

/** Color de texto (blanco o casi negro) con mejor contraste sobre `fondo`. */
export function textoSobre(fondo: string): string {
  return contraste(fondo, BLANCO) >= contraste(fondo, TINTA) ? BLANCO : TINTA;
}

/** Oscurece el color hasta lograr contraste ≥ 4.5:1 sobre blanco (para textos y enlaces). */
export function tintaLegible(hex: string, fondo = BLANCO): string {
  let color = hex;
  for (let i = 1; contraste(color, fondo) < 4.5 && i <= 20; i++) color = mix(hex, '#000000', i * 0.05);
  return color;
}

export interface Paleta {
  base: string;
  oscuro: string;
  suave: string;
  texto: string;
  tinta: string;
}

export function paleta(hex: string): Paleta {
  return {
    base: hex.toUpperCase(),
    oscuro: mix(hex, '#000000', 0.18),
    suave: mix(hex, '#FFFFFF', 0.9),
    texto: textoSobre(hex),
    tinta: tintaLegible(hex),
  };
}

const triplete = (hex: string) => hexToRgb(hex).join(' ');

/** Variables CSS (en formato "R G B" para soportar opacidad en Tailwind). */
export function variablesCss(tema: Tema): Record<string, string> {
  const p = paleta(tema.primario);
  const a = paleta(tema.acento);
  return {
    '--brand': triplete(p.base),
    '--brand-dark': triplete(p.oscuro),
    '--brand-light': triplete(p.suave),
    '--brand-fg': triplete(p.texto),
    '--brand-ink': triplete(p.tinta),
    '--accent': triplete(a.base),
    '--accent-dark': triplete(a.oscuro),
    '--accent-light': triplete(a.suave),
    '--accent-fg': triplete(a.texto),
    '--accent-ink': triplete(a.tinta),
  };
}

export function hojaDeEstilos(tema: Tema): string {
  const vars = Object.entries(variablesCss(tema))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root{${vars}}`;
}
