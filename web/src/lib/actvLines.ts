/**
 * Colori ufficiali delle linee di navigazione ACTV (GTFS: route_color e route_text_color),
 * generati da pipeline/export_simulation_data.py. Bus e tram restano colorati per tipo di mezzo:
 * nel GTFS quasi tutte le linee urbane hanno lo stesso colore.
 */
import data from '@/data/actv-line-colors.json';

const LINES = data.lines as Record<string, { color: string; text: string | null }>;

/** Categorie di mezzo della rete di navigazione (le uniche con il colore di linea). */
const WATER = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']);

/** Colore ufficiale della linea, solo per i mezzi di navigazione; null se non noto. */
export function lineColor(line: string | null | undefined, category?: string | null): string | null {
  if (!line || (category && !WATER.has(category))) return null;
  return LINES[line]?.color ?? null;
}

/** Luminanza relativa (0 scuro, 1 chiaro) di un colore #RRGGBB. */
export function luminance(hex: string): number {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return 0.5;
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Colore del testo sulla linea: quello del GTFS, altrimenti bianco o nero secondo il contrasto. */
export function lineTextColor(line: string | null | undefined, background: string): string {
  const official = line ? LINES[line]?.text : null;
  return official ?? (luminance(background) > 0.45 ? '#000000' : '#FFFFFF');
}

/** Colori chiari (es. linea 1 bianca) che su sfondo chiaro hanno bisogno di un bordo scuro. */
export function needsDarkOutline(color: string): boolean {
  return luminance(color) > 0.6;
}
