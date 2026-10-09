/**
 * Briccole, segnalamenti e canali della laguna da OpenStreetMap (pipeline/import_osm_waterways.py, ODbL).
 * Il file dei dati resta lato server (/api/lagoon-network): qui tipi e funzioni condivise.
 */

/** 1 briccola, 2 palo, 3 segnale (meda), 4 boa, 5 fanale */
export type MarkerKind = 1 | 2 | 3 | 4 | 5;

/** [lon, lat, tipo, id del nodo OSM] */
export type LagoonMarker = [number, number, MarkerKind, number];

export interface LagoonCanal {
  id: number;
  name: string | null;
  coords: [number, number][];
}

export interface LagoonNetwork {
  generatedAt: string;
  license: string;
  attribution: string;
  counts: Record<'briccola' | 'palo' | 'segnale' | 'boa' | 'fanale' | 'canals' | 'namedCanals', number>;
  markers: LagoonMarker[];
  canals: LagoonCanal[];
}

export const MARKER_KEY: Record<MarkerKind, 'briccola' | 'palo' | 'segnale' | 'boa' | 'fanale'> = {
  1: 'briccola',
  2: 'palo',
  3: 'segnale',
  4: 'boa',
  5: 'fanale',
};

export const MARKER_COLORS: Record<MarkerKind, string> = {
  1: '#a16207',
  2: '#78716c',
  3: '#0ea5e9',
  4: '#f97316',
  5: '#facc15',
};

function metersBetween(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const k = Math.cos((lat1 * Math.PI) / 180) * 111320;
  return Math.hypot((lon2 - lon1) * k, (lat2 - lat1) * 110540);
}

/** Lunghezza di un canale in metri. */
export function canalLengthMeters(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += metersBetween(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
  return total;
}

/** Distanza in pixel da un punto a un segmento (coordinate schermo). */
export function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
