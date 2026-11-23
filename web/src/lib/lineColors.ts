/**
 * Colori ufficiali delle linee per le risposte delle API e del server MCP: route_color e route_text_color
 * del GTFS ACTV (navigazione e automobilistico, pipeline/export_simulation_data.py) e del GTFS Alilaguna
 * (pipeline/import_alilaguna_gtfs.py). Nessun colore inventato: senza fonte il colore è null.
 */
import data from '@/data/actv-line-colors.json';
import { ALILAGUNA_ROUTES } from './alilaguna-schedule';
import { isWaterCategory, luminance } from './actvLines';

type Entry = { color: string; text: string | null };
const NAV = data.lines as Record<string, Entry>;
const BUS = ((data as { busLines?: Record<string, Entry> }).busLines ?? {}) as Record<string, Entry>;

/** Categorie della rete automobilistica ACTV (bus di terraferma, bus del Lido e di Pellestrina, tram, People Mover) */
const LAND = new Set(['bus', 'island', 'tram', 'peoplemover']);

export interface LineColors {
  /** sfondo della linea, "#RRGGBB" maiuscolo, oppure null */
  color: string | null;
  /** testo leggibile sullo sfondo (contrasto WCAG ≥ 4,5:1), oppure null */
  textColor: string | null;
}

const NONE: LineColors = { color: null, textColor: null };
const HEX = /^#?([0-9A-Fa-f]{6})$/;

/** "#RRGGBB" maiuscolo, null se il valore non è un colore valido */
export function normalizeHex(value: string | null | undefined): string | null {
  const m = value?.trim().match(HEX);
  return m ? `#${m[1].toUpperCase()}` : null;
}

/** Rapporto di contrasto WCAG 2 tra due colori (1–21) */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Minimo WCAG AA per il testo normale */
export const MIN_CONTRAST = 4.5;

/**
 * Testo sulla linea: quello del GTFS se è leggibile (≥ 4,5:1), altrimenti bianco o nero, il più contrastato.
 * Alcune coppie del GTFS (es. linea 15 arancio su giallo) restano sotto la soglia e vengono sostituite.
 */
export function readableTextColor(background: string, official?: string | null): string {
  const o = normalizeHex(official);
  if (o && contrastRatio(background, o) >= MIN_CONTRAST) return o;
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF') ? '#000000' : '#FFFFFF';
}

const pair = (e: Entry | undefined): LineColors => {
  const color = normalizeHex(e?.color);
  return color ? { color, textColor: readableTextColor(color, e?.text) } : NONE;
};

/** Linea Alilaguna da «Blu», «Linea Blu», «BLU» o dal codice della rotta («B») */
function alilagunaRoute(line: string) {
  const l = line.replace(/^linea\s+/i, '').trim().toUpperCase();
  return ALILAGUNA_ROUTES.find((r) => r.lineCode.toUpperCase() === l || r.id.toUpperCase() === l || r.name.replace(/^linea\s+/i, '').toUpperCase() === l);
}

/**
 * Colori di una linea secondo operatore e categoria del mezzo. Navigazione e bus ACTV hanno linee omonime
 * (es. 2, N, 11): la categoria sceglie il feed giusto. Altri operatori (treni, ATVO, FlixBus…): null.
 */
export function officialLineColors(line: string | null | undefined, category?: string | null, operator?: string | null): LineColors {
  if (!line) return NONE;
  const op = (operator ?? 'ACTV').toLowerCase();
  if (op === 'alilaguna' || category === 'alilaguna') {
    const r = alilagunaRoute(line);
    return r ? pair({ color: r.color, text: null }) : NONE;
  }
  if (op !== 'actv') return NONE;
  if (isWaterCategory(category)) return pair(NAV[line]);
  if (category && LAND.has(category)) return pair(BUS[line]);
  return NONE;
}

/**
 * Colori delle linee servite da una fermata della mappa (mode: navigazione, ferry, tram, peoplemover, bus).
 * Solo le linee con un colore ufficiale.
 */
export function stopLineColors(lines: readonly string[] | null | undefined, mode: string | null | undefined): Record<string, LineColors> {
  const water = mode === 'navigazione' || mode === 'ferry';
  const out: Record<string, LineColors> = {};
  for (const l of lines ?? []) {
    const c = pair((water ? NAV : BUS)[l]);
    if (c.color) out[l] = c;
  }
  return out;
}
