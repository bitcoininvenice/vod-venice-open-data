// Funzioni di posizione e costanti condivise tra MapEngine (clic) e i layer di disegno.
import { FlightItem } from '@/lib/types';
import { SatelliteItem } from '@/lib/types';
import { dateAtRomeSeconds } from '@/lib/time';
import { groundTrack } from '@/lib/orbits';
import { headingAt } from '@/lib/orbits';
import { satrecFor } from '@/lib/orbits';
import { stateAt } from '@/lib/orbits';

export const MARITIME_CHANNELS = [
  {
    id: 'CANALE_PETROLI',
    name: 'Canale dei Petroli / Malamocco - Marghera',
    type: 'DEEP_WATER',
    color: '#f59e0b',
    depth: '-14.5m',
    waypoints: [
      { name: 'PILOTA MALAMOCCO', depth: '-15.0m', lon: 12.3600, lat: 45.3200 },
      { name: 'BOCCA MALAMOCCO MOSE', depth: '-14.0m', lon: 12.3350, lat: 45.3340 },
      { name: 'ALBERONI ROCCHETTA', depth: '-13.5m', lon: 12.2980, lat: 45.3520 },
      { name: 'CURVA S. LEONARDO', depth: '-12.5m', lon: 12.2700, lat: 45.3800 },
      { name: 'FUSINA WP', depth: '-12.0m', lon: 12.2560, lat: 45.4180 },
      { name: 'BANCHINE MARGHERA', depth: '-11.5m', lon: 12.2450, lat: 45.4420 }
    ]
  },
  {
    id: 'LIDO_TRONCHETTO',
    name: 'Rotta Bocca di Lido -> Tronchetto Marittima',
    type: 'CRUISE_TRONCHETTO',
    color: '#6366f1',
    depth: '-11.0m',
    waypoints: [
      { name: 'FARO DIGA LIDO', depth: '-12.0m', lon: 12.4480, lat: 45.4180 },
      { name: 'BOCCA DI LIDO MOSE', depth: '-11.0m', lon: 12.4220, lat: 45.4210 },
      { name: 'BACINO S. NICOLÒ', depth: '-10.0m', lon: 12.3850, lat: 45.4290 },
      { name: 'CANALE DELLE NAVI', depth: '-9.5m', lon: 12.3650, lat: 45.4280 },
      { name: 'CANALE S. MARCO NORD', depth: '-9.0m', lon: 12.3350, lat: 45.4330 },
      { name: 'TRONCHETTO ISONZO', depth: '-8.5m', lon: 12.3050, lat: 45.4418 }
    ]
  },
  {
    id: 'FERRY_LINEA_17',
    name: 'Canale Ferry-Boat Linea 17',
    type: 'FERRY',
    color: '#14b8a6',
    depth: '-7.0m',
    waypoints: [
      { name: 'TRONCHETTO FERRY', depth: '-6.5m', lon: 12.3050, lat: 45.4418 },
      { name: 'GIUDECCA OVEST', depth: '-7.0m', lon: 12.3200, lat: 45.4330 },
      { name: 'GIUDECCA EST', depth: '-7.0m', lon: 12.3550, lat: 45.4290 },
      { name: 'LIDO S. NICOLÒ DARSENA', depth: '-6.0m', lon: 12.3820, lat: 45.4310 }
    ]
  },
  {
    id: 'FAST_FERRY_ISTRIA',
    name: 'Rotta Alto Adriatico - Aliscafi Istria',
    type: 'FAST_FERRY',
    color: '#06b6d4',
    depth: '-15.0m',
    waypoints: [
      { name: 'SAN BASILIO MARITTIMA', depth: '-7.5m', lon: 12.3160, lat: 45.4335 },
      { name: 'CANALE DELLA GRAZIA', depth: '-8.0m', lon: 12.3450, lat: 45.4220 },
      { name: 'BOCCA DI LIDO SUD', depth: '-10.5m', lon: 12.4200, lat: 45.4150 },
      { name: 'ADRIATICO OPEN SEA', depth: '-22.0m', lon: 12.4850, lat: 45.3900 }
    ]
  }
];

// Smooth Kinematics Helper: Interpolate point along polyline waypoints
export function interpolateAlongWaypoints(
  wps: { lon: number; lat: number }[],
  progress: number
): { lon: number; lat: number; heading: number } {
  if (!wps || wps.length === 0) return { lon: 12.338, lat: 45.438, heading: 0 };
  if (wps.length === 1) return { lon: wps[0].lon, lat: wps[0].lat, heading: 0 };

  const dists: number[] = [0];
  for (let i = 1; i < wps.length; i++) {
    const d = Math.hypot(wps[i].lon - wps[i - 1].lon, wps[i].lat - wps[i - 1].lat);
    dists.push(dists[i - 1] + d);
  }
  const totalDist = dists[dists.length - 1];
  if (totalDist <= 0) return { lon: wps[0].lon, lat: wps[0].lat, heading: 0 };

  const targetDist = Math.max(0, Math.min(1, progress)) * totalDist;

  let seg = 1;
  while (seg < dists.length && dists[seg] < targetDist) {
    seg++;
  }
  if (seg >= dists.length) seg = dists.length - 1;

  const p0 = wps[seg - 1];
  const p1 = wps[seg];
  const segSpan = dists[seg] - dists[seg - 1];
  const frac = segSpan > 0 ? (targetDist - dists[seg - 1]) / segSpan : 0;

  const lon = p0.lon + frac * (p1.lon - p0.lon);
  const lat = p0.lat + frac * (p1.lat - p0.lat);
  const headingRad = Math.atan2(p1.lon - p0.lon, p1.lat - p0.lat);
  const heading = (headingRad * 180 / Math.PI + 360) % 360;

  return { lon, lat, heading };
}

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
