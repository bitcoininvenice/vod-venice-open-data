import {
  degreesLat,
  degreesLong,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
  type SatRec,
} from 'satellite.js';

/** Osservatore di riferimento: Piazza San Marco. */
export const VENICE_OBSERVER = { latitude: 45.4341, longitude: 12.3388, height: 0.005 };

export interface OrbitState {
  lat: number;
  lon: number;
  altKm: number;
  speedKmh: number;
}

export interface PassInfo {
  start: Date;
  end: Date;
  maxElevationDeg: number;
}

const satrecCache = new Map<string, SatRec>();

export function satrecFor(tle1: string, tle2: string): SatRec {
  const key = tle1 + tle2;
  let rec = satrecCache.get(key);
  if (!rec) {
    rec = twoline2satrec(tle1, tle2);
    satrecCache.set(key, rec);
  }
  return rec;
}

/** Posizione geodetica del satellite a una data (SGP4). null se la propagazione fallisce. */
export function stateAt(rec: SatRec, date: Date): OrbitState | null {
  const pv = propagate(rec, date);
  if (!pv || typeof pv.position !== 'object' || typeof pv.velocity !== 'object') return null;
  const geo = eciToGeodetic(pv.position, gstime(date));
  const v = pv.velocity;
  return {
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    altKm: geo.height,
    speedKmh: Math.hypot(v.x, v.y, v.z) * 3600,
  };
}

/** Elevazione in gradi sull'orizzonte dell'osservatore. */
export function elevationAt(rec: SatRec, date: Date, observer = VENICE_OBSERVER): number | null {
  const pv = propagate(rec, date);
  if (!pv || typeof pv.position !== 'object') return null;
  const ecf = eciToEcf(pv.position, gstime(date));
  const look = ecfToLookAngles(
    {
      latitude: (observer.latitude * Math.PI) / 180,
      longitude: (observer.longitude * Math.PI) / 180,
      height: observer.height,
    },
    ecf,
  );
  return (look.elevation * 180) / Math.PI;
}

/** Traccia a terra tra `fromMin` e `toMin` minuti rispetto a `date`. */
export function groundTrack(rec: SatRec, date: Date, fromMin = -20, toMin = 20, stepSec = 30): [number, number][] {
  const out: [number, number][] = [];
  for (let t = fromMin * 60; t <= toMin * 60; t += stepSec) {
    const s = stateAt(rec, new Date(date.getTime() + t * 1000));
    if (s) out.push([s.lon, s.lat]);
  }
  return out;
}

/** Direzione di avanzamento a terra in gradi (0 = nord). */
export function headingAt(rec: SatRec, date: Date): number {
  const a = stateAt(rec, date);
  const b = stateAt(rec, new Date(date.getTime() + 10_000));
  if (!a || !b) return 0;
  const dLon = ((b.lon - a.lon + 540) % 360) - 180;
  const y = Math.sin((dLon * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
  const x =
    Math.cos((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180) -
    Math.sin((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.cos((dLon * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Prossimo passaggio sopra l'osservatore con elevazione minima `minElevationDeg`, cercato nelle
 * successive `hours` ore. Se il satellite è già visibile restituisce il passaggio in corso.
 */
export function nextPass(
  rec: SatRec,
  from: Date,
  { minElevationDeg = 10, hours = 48, stepSec = 30 } = {},
): PassInfo | null {
  const end = from.getTime() + hours * 3600_000;
  let t = from.getTime();
  // Se è già sopra la soglia, risale all'inizio del passaggio in corso
  while ((elevationAt(rec, new Date(t)) ?? -90) >= minElevationDeg && t > from.getTime() - 3600_000) {
    t -= stepSec * 1000;
  }
  for (; t < end; t += stepSec * 1000) {
    const el = elevationAt(rec, new Date(t)) ?? -90;
    if (el < minElevationDeg) continue;
    const start = new Date(t);
    let maxEl = el;
    let u = t;
    while (u < end) {
      u += stepSec * 1000;
      const e = elevationAt(rec, new Date(u)) ?? -90;
      if (e < minElevationDeg) break;
      maxEl = Math.max(maxEl, e);
    }
    return { start, end: new Date(u), maxElevationDeg: Math.round(maxEl) };
  }
  return null;
}
