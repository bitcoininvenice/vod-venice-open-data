import { describe, expect, it } from 'vitest';
import type { SimProfile, SimShape } from '@/lib/simulationCore';
import {
  DISAGREE_SECONDS, indexTrips, matchTrip, nearStop, parseGtfsTime, passesNear, positionDelay, scheduledOffsetAt, toGrid, trustDelay,
} from './positionDelay';

/** Percorso rettilineo da (lon0, lat) verso est lungo `meters`, con fermate a 0 e alla fine. */
function straightProfile(lon0: number, lat: number, meters: number, seconds: number, line = '1'): SimProfile {
  const [x0, y0] = toGrid(lon0, lat);
  const n = 11;
  const xy = new Float32Array(n * 2);
  const cum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    xy[2 * i] = x0 + (meters * i) / (n - 1);
    xy[2 * i + 1] = y0;
    cum[i] = (meters * i) / (n - 1);
  }
  const sh: SimShape = { xy, cum, n };
  return { sh, route: { n: line, c: 'vaporetto', ci: 0, cat: 'vaporetto' }, T: Int32Array.from([0, seconds]), Dd: Int32Array.from([0, meters]) };
}

/** Longitudine a `m` metri a est di lon0 (scala della griglia della simulazione). */
const east = (lon0: number, lat: number, m: number) => {
  const perDegree = toGrid(lon0 + 1, lat)[0] - toGrid(lon0, lat)[0];
  return lon0 + m / perDegree;
};

describe('ritardo dalla posizione', () => {
  const LON = 12.3;
  const LAT = 45.43;
  const p = straightProfile(LON, LAT, 1000, 600); // 1 km in 10 minuti

  it('orario interpolato lungo il percorso e fermate', () => {
    expect(scheduledOffsetAt(p, 500)).toBe(300);
    expect(scheduledOffsetAt(p, 1200)).toBeNull();
    expect(nearStop(p, 8)).toBe(true);
    expect(nearStop(p, 500)).toBe(false);
  });

  it('a metà percorso dopo 7 minuti il mezzo ha 2 minuti di ritardo', () => {
    expect(positionDelay(p, east(LON, LAT, 500), LAT, 420)).toBe(120);
    // in anticipo: a metà percorso dopo 4 minuti
    expect(positionDelay(p, east(LON, LAT, 500), LAT, 240)).toBe(-60);
  });

  it('niente calcolo a un pontile o lontano dal percorso', () => {
    expect(positionDelay(p, east(LON, LAT, 5), LAT, 300)).toBeNull();
    expect(positionDelay(p, east(LON, LAT, 500), LAT + 0.01, 300)).toBeNull(); // circa 1 km a nord
  });

  it('percorso che ripassa dallo stesso punto: vince il passaggio coerente con il ritardo atteso', () => {
    // andata 0-1000 m e ritorno 1000-2000 m sullo stesso tratto (navetta)
    const [x0, y0] = toGrid(LON, LAT);
    const pts = [0, 250, 500, 750, 1000, 750, 500, 250, 0];
    const sh: SimShape = { xy: Float32Array.from(pts.flatMap((m) => [x0 + m, y0])), cum: Float32Array.from(pts.map((_, i) => i * 250)), n: pts.length };
    const loop: SimProfile = { sh, route: p.route, T: Int32Array.from([0, 600, 1200]), Dd: Int32Array.from([0, 1000, 2000]) };
    expect(passesNear(sh, ...toGrid(east(LON, LAT, 500), LAT)).length).toBe(2);
    // a 500 m dopo 15 minuti: è il ritorno (in orario a 900 s, quindi 0 s di ritardo), non l'andata (+600 s)
    expect(positionDelay(loop, east(LON, LAT, 500), LAT, 900, 0)).toBe(0);
  });

  it('verifica con ACTV: preferisce la posizione, scarta i disaccordi oltre 15 minuti', () => {
    expect(trustDelay(120, 90)).toEqual({ seconds: 120, source: 'position' });
    expect(trustDelay(null, 90)).toEqual({ seconds: 90, source: 'actv' });
    expect(trustDelay(60, null)).toEqual({ seconds: 60, source: 'position' });
    expect(trustDelay(60, 60 + DISAGREE_SECONDS + 1)).toBe('conflict');
    expect(trustDelay(9000, null)).toBe('conflict');
    expect(trustDelay(null, null)).toBeNull();
  });

  it('associa la corsa per linea e partenza, provando gli altri tipi di giorno', () => {
    expect(parseGtfsTime('25:10:00')).toBe(90600);
    expect(parseGtfsTime('7:05:30')).toBe(25530);
    expect(parseGtfsTime('x')).toBeNull();
    const empty = { tP: new Int32Array(0), t0: new Int32Array(0), t1: new Int32Array(0), count: 0 };
    const model = {
      shapes: [], routes: [], profs: [p],
      daysTrips: { weekday: { tP: Int32Array.from([0]), t0: Int32Array.from([45000]), t1: Int32Array.from([45600]), count: 1 }, saturday: empty, sunday: empty },
    };
    const index = indexTrips(model);
    expect(matchTrip(index, '1', 45000, 'weekday')?.departure).toBe(45000);
    expect(matchTrip(index, '1', 45000, 'sunday')?.profile).toBe(p);
    expect(matchTrip(index, '2', 45000, 'weekday')).toBeNull();
  });
});
