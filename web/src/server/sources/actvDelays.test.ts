import { describe, expect, it } from 'vitest';
import { arrivalsNear, findTrip, vehicleDelay } from './actvDelays';
import { stopsNear } from './gtfsIndex';
import type { TripDelay } from './gtfsRt';

const NOW = 1_800_000_000;
// Fermata reale dell'indice GTFS: Lido S.M.E. "B" (5001)
const trip = (over: Partial<TripDelay> = {}): TripDelay => ({
  tripId: 'AUT_ACTV_653_20839',
  routeId: '1_UN',
  startTime: '12:30:00',
  startDate: '20271015',
  delay: null,
  timestamp: NOW - 10,
  stops: [
    { seq: 2, stopId: '5001', delay: 99, time: NOW + 300 },
    { seq: 3, stopId: '5002', delay: 140, time: NOW + 900 },
  ],
  ...over,
});

describe('ritardi ACTV (server)', () => {
  it('trova la corsa anche con prefisso diverso e calcola il ritardo attuale', () => {
    const trips = new Map([['653_20839', trip()]]);
    const t = findTrip(trips, 'NAV_ACTV_653_20839');
    const d = vehicleDelay(t, NOW)!;
    expect(d.seconds).toBe(99);
    expect(d.status).toBe('onTime');
    expect(d.nextStopName).toMatch(/Lido/);
    expect(d.estimate).toBe('predicted');
    expect(d.source).toBe('actv');
  });

  it('usa il ritardo della corsa dichiarato da ACTV anche senza dettagli per fermata', () => {
    const d = vehicleDelay(trip({ delay: 420, stops: [] }), NOW)!;
    expect(d.seconds).toBe(420);
    expect(d.nextStopName).toBeNull();
    expect(d.actvSeconds).toBe(420);
  });

  it('con un valore verificato dalla posizione mostra quello e tiene il dato ACTV come verifica', () => {
    const d = vehicleDelay(trip({ delay: 120 }), NOW, { seconds: 150, source: 'position', updatedAt: NOW - 5 })!;
    expect(d).toMatchObject({ seconds: 150, source: 'position', actvSeconds: 120, updatedAt: NOW - 5 });
    expect(d.nextStopName).toMatch(/Lido/);
  });

  it('non mostra il ritardo se l’aggiornamento è vecchio', () => {
    expect(vehicleDelay(trip({ timestamp: NOW - 600 }), NOW)).toBeNull();
    expect(vehicleDelay(undefined, NOW)).toBeNull();
  });

  it('prossimi arrivi alle fermate vicine, in ordine di orario', () => {
    expect(stopsNear(45.417992, 12.368725, 50)).toContain('5001');
    const later = trip({ tripId: 'X_1_2', stops: [{ seq: 1, stopId: '5001', delay: 400, time: NOW + 1200 }] });
    const stale = trip({ tripId: 'X_3_4', timestamp: NOW - 999 });
    const arr = arrivalsNear([later, trip(), stale], 45.417992, 12.368725, { nowSec: NOW, radius: 50 });
    expect(arr.map((a) => a.time)).toEqual([NOW + 300, NOW + 1200]);
    expect(arr[0].line).toBe('2'); // dalla corsa (indice GTFS)
    expect(arr[1].line).toBe('1'); // corsa sconosciuta: dalla linea (route_id 1_UN)
    expect(arr[1].status).toBe('veryLate');
  });
});
