import type { SportPlace } from './types';

/** Distanza entro cui un impianto OSM e una segnalazione CAMPO sono considerati lo stesso posto. */
export const SAME_PLACE_METERS = 60;

function meters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (a.lat - b.lat) * 111_000;
  const dLon = (a.lon - b.lon) * 111_000 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/**
 * Unisce le due fonti: le segnalazioni CAMPO (descrizioni e orari della comunità) prevalgono sugli
 * impianti OSM vicini dello stesso sport, o senza sport indicato; gli altri impianti OSM restano.
 */
export function mergeSportPlaces(campo: SportPlace[], osm: SportPlace[]): SportPlace[] {
  const kept = osm.filter(
    (o) =>
      !campo.some(
        (c) => meters(c, o) <= SAME_PLACE_METERS && (o.sports.length === 0 || o.sports.some((s) => c.sports.includes(s)))
      )
  );
  return [...campo, ...kept];
}

/** Sport principali mostrati come filtro; gli altri finiscono in "altro". */
export const SPORT_FILTERS = ['basketball', 'soccer', 'tennis', 'volleyball', 'fitness', 'rowing', 'swimming'] as const;
export type SportFilter = (typeof SPORT_FILTERS)[number] | 'other' | 'all';

export function matchesSportFilter(p: SportPlace, filter: SportFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'other') return !p.sports.some((s) => (SPORT_FILTERS as readonly string[]).includes(s));
  if (filter === 'volleyball') return p.sports.includes('volleyball') || p.sports.includes('beachvolleyball');
  return p.sports.includes(filter);
}

/** Colore del simbolo per lo sport principale. */
export const SPORT_COLORS: Record<string, string> = {
  basketball: '#f97316',
  soccer: '#16a34a',
  tennis: '#ca8a04',
  volleyball: '#2563eb',
  beachvolleyball: '#2563eb',
  fitness: '#dc2626',
  rowing: '#0891b2',
  swimming: '#0ea5e9',
};
export const sportColor = (p: SportPlace): string => SPORT_COLORS[p.sports[0] ?? ''] ?? '#64748b';
