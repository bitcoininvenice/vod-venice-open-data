/**
 * Ordinanze temporanee di traffico acqueo collegate ai canali: un canale è interessato se il punto messo
 * dal Comune sulla sua mappa cade sul canale, oppure, se il punto manca, se il titolo dell'atto lo nomina.
 */
import type { OrdinanceItem, OrdinanceKind } from './contracts/ordinances';
import { pointSegmentDistance } from './lagoonNetwork';

/** Distanza massima tra il punto dell'ordinanza e il canale (m) */
const ORDINANCE_CANAL_METERS = 30;

const isWaterTraffic = (o: OrdinanceItem) => /traffico acqueo/i.test(o.ambito);

/** Distanza in metri di un punto da una linea [lon, lat][] (piano locale) */
function distanceToPath(lon: number, lat: number, path: [number, number][]): number {
  const kx = Math.cos((lat * Math.PI) / 180) * 111320;
  const ky = 110540;
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    best = Math.min(best, pointSegmentDistance(lon * kx, lat * ky, ax * kx, ay * ky, bx * kx, by * ky));
  }
  return best;
}

/** Ordinanze di traffico acqueo che riguardano il canale con questo nome e tracciato. */
export function ordinancesForCanal(name: string | null, path: [number, number][], ordinances: OrdinanceItem[]): OrdinanceItem[] {
  return ordinances.filter((o) => {
    if (!isWaterTraffic(o)) return false;
    // il punto del Comune è più preciso del nome (un atto può riguardare solo un tratto)
    if (o.positionSource === 'comune' && o.lat != null && o.lon != null) return distanceToPath(o.lon, o.lat, path) <= ORDINANCE_CANAL_METERS;
    return !!name && o.canalName === name;
  });
}

/** Per ogni canale (id OSM) le ordinanze che lo riguardano; solo i canali interessati. */
export function ordinancesByCanal(
  canals: { id: number; name: string | null; coords: [number, number][] }[],
  ordinances: OrdinanceItem[],
): Map<number, OrdinanceItem[]> {
  const out = new Map<number, OrdinanceItem[]>();
  if (!ordinances.some(isWaterTraffic)) return out;
  for (const c of canals) {
    if (c.coords.length < 2) continue;
    const list = ordinancesForCanal(c.name, c.coords, ordinances);
    if (list.length > 0) out.set(c.id, list);
  }
  return out;
}

export type PlacedOrdinance = OrdinanceItem & { lat: number; lon: number };

/** Ordinanza con una posizione sulla mappa (dal Comune, da un luogo o da un canale citati nel titolo) */
export const isPlacedOrdinance = (o: OrdinanceItem): o is PlacedOrdinance => o.lat !== null && o.lon !== null;

/** Colore del segnale per tipo di ordinanza */
export const ORDINANCE_COLORS: Record<OrdinanceKind, string> = {
  closure: '#ef4444',
  works: '#f59e0b',
  event: '#a855f7',
  other: '#64748b',
};
