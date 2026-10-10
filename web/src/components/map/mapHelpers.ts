// Funzioni di posizione e costanti condivise tra MapEngine (clic) e i layer di disegno.
import type { FlightItem, SatelliteItem } from '@/lib/types';
import { dateAtRomeSeconds } from '@/lib/time';
import { groundTrack, headingAt, satrecFor, stateAt } from '@/lib/orbits';

// Live kinematics for airplanes around Venice (continuous 60 FPS motion synced to timeline)
export function getLiveFlight(
  f: FlightItem,
  t: number
): { lon: number; lat: number; heading: number; alt: number } {
  if (f.onGround || f.status === 'TAXI') {
    return {
      lon: f.lon,
      lat: f.lat,
      heading: f.trackDegrees,
      alt: Math.max(2, f.altitudeMeters || 2)
    };
  }

  const rad = (f.trackDegrees * Math.PI) / 180;
  const cycleSeconds = 240; // 4 minutes radar loop across lagoon sector
  const seed = (parseInt(f.icao24, 16) || 0) * 31;
  const progress = ((t + seed) % cycleSeconds) / cycleSeconds;

  // Flight displacement along its track angle (-0.05° to +0.05° across the lagoon sector)
  const distDeg = (progress - 0.5) * 0.10;
  const lon = f.lon + Math.sin(rad) * distDeg;
  const lat = f.lat + Math.cos(rad) * distDeg;
  const heading = f.trackDegrees;
  const alt = Math.max(120, Math.round(f.altitudeMeters + (f.verticalRate || 0) * (progress - 0.5) * 40));

  return { lon, lat, heading, alt };
}

// Live kinematics for AIS ships along maritime navigation channels

// Tracce a terra in cache per satellite e minuto: il ricalcolo SGP4 avviene al massimo una volta al minuto
export const groundTrackCache = new Map<string, [number, number][]>();

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
