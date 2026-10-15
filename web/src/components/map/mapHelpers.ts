// Funzioni di posizione e costanti condivise tra MapEngine (clic) e i layer di disegno.
import type { FlightItem, SatelliteItem } from '@/lib/types';
import { dateAtRomeSeconds } from '@/lib/time';
import { groundTrack, headingAt, satrecFor, stateAt } from '@/lib/orbits';

/** true se l'utente ha chiesto di ridurre le animazioni */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Posizione dell'aereo da disegnare: quella dell'ultima lettura OpenSky (aggiornata ogni 30 s).
 * Nessuno spostamento stimato tra una lettura e l'altra: si mostra solo quanto ricevuto.
 */
export function getLiveFlight(f: FlightItem): { lon: number; lat: number; heading: number; alt: number } {
  return { lon: f.lon, lat: f.lat, heading: f.trackDegrees, alt: Math.max(f.onGround ? 2 : 120, Math.round(f.altitudeMeters || 0)) };
}

// Tracce a terra in cache per satellite e minuto: il ricalcolo SGP4 avviene al massimo una volta al minuto
const groundTrackCache = new Map<string, [number, number][]>();

/**
 * Posizione del satellite all'ora simulata (propagazione SGP4 dal TLE CelesTrak).
 * Senza TLE resta ferma alla posizione di riferimento: nessun movimento inventato.
 */
export function getLiveSatellite(
  sat: SatelliteItem,
  t: number
): { lon: number; lat: number; heading: number; track: [number, number][] } {
  if (!sat.tle) {
    return { lon: sat.currentLon, lat: sat.currentLat, heading: sat.heading, track: [] };
  }
  const rec = satrecFor(sat.tle[0], sat.tle[1]);
  const date = dateAtRomeSeconds(t);
  const state = stateAt(rec, date);
  if (!state) {
    return { lon: sat.currentLon, lat: sat.currentLat, heading: sat.heading, track: [] };
  }
  const key = `${sat.id}|${Math.floor(date.getTime() / 60000)}`;
  let track = groundTrackCache.get(key);
  if (!track) {
    if (groundTrackCache.size > 200) groundTrackCache.clear();
    track = groundTrack(rec, date, -12, 12, 20);
    groundTrackCache.set(key, track);
  }
  return { lon: state.lon, lat: state.lat, heading: headingAt(rec, date), track };
}
