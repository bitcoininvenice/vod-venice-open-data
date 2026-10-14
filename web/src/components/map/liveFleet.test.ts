import { describe, expect, it } from 'vitest';
import type { SimProfile } from '@/lib/simulationCore';
import type { RealtimeVehicleDto } from '@/lib/contracts/realtime';
import { isLiveClock, liveDistance, realtimeByTrip, tripKey } from './liveFleet';

// Corsa sintetica: 6 km in 10 minuti (10 m/s)
const prof = {
  sh: { xy: new Float32Array([0, 0, 6000, 0]), cum: new Float32Array([0, 6000]), n: 2 },
  route: { n: '1', c: 'vaporetto', ci: 0, cat: 'vaporetto' },
  T: Int32Array.from([0, 600]),
  Dd: Int32Array.from([0, 6000]),
} as SimProfile;

const vehicle = (over: Partial<RealtimeVehicleDto>): RealtimeVehicleDto => ({
  id: 'v1', tripId: null, routeId: null, label: null, lat: 45.43, lon: 12.33, bearing: null, timestamp: 0,
  network: 'navigazione', line: '1', category: 'vaporetto', startTime: '10:00:00', startDate: '20261014',
  delay: { seconds: 120, status: 'onTime', updatedAt: 0, nextStopId: null, nextStopName: null, nextStopTime: null, estimate: 'constant', source: 'position', actvSeconds: 100 },
  ...over,
});

describe('flotta live', () => {
  it('abbina il mezzo GPS alla corsa per linea e partenza, solo se ha un ritardo', () => {
    const m = realtimeByTrip([vehicle({}), vehicle({ id: 'v2', startTime: '10:10:00', delay: null }), vehicle({ id: 'v3', line: null })]);
    expect(m.get(tripKey('1', 36000, 'navigazione'))?.id).toBe('v1');
    expect(m.get(tripKey('1', 36000, 'automobilistico'))).toBeUndefined();
    expect(m.size).toBe(1);
  });

  it('modalità live: orologio della mappa vicino all\'ora reale, anche a cavallo della mezzanotte', () => {
    expect(isLiveClock(36000, 36060)).toBe(true);
    expect(isLiveClock(36000, 40000)).toBe(false);
    expect(isLiveClock(86390, 20)).toBe(true);
  });

  it('parte dalla posizione dell\'orario e insegue quella spostata del ritardo lungo il percorso', () => {
    // 5 minuti dopo la partenza, 2 minuti di ritardo: orario a 3000 m, posizione reale a 1800 m
    const first = liveDistance('a', prof, 300, 120, 0);
    expect(first).toBe(3000);
    const after = liveDistance('a', prof, 300, 120, 500);
    expect(after).toBeLessThan(3000);
    expect(after).toBeGreaterThan(1800);
    // dopo qualche secondo è arrivata (il bersaglio avanza con l'orario: +30 m in 3 s)
    const later = liveDistance('a', prof, 303, 120, 3500);
    expect(Math.abs(later - 1830)).toBeLessThan(15);
  });

  it('un nuovo ritardo sposta il bersaglio: l\'icona accelera senza salti', () => {
    liveDistance('b', prof, 300, 0, 0);
    liveDistance('b', prof, 300, 0, 5000); // allineata all'orario
    const step = liveDistance('b', prof, 300.1, 60, 5100) - 3001; // arriva 1 minuto di ritardo: bersaglio −600 m
    expect(step).toBeLessThan(0);
    expect(step).toBeGreaterThan(-600);
  });
});

describe('mezzi GPS fuori servizio', () => {
  it('senza corsa né linea il mezzo non è in servizio', async () => {
    const { inService } = await import('./liveFleet');
    expect(inService({ line: null, tripId: null })).toBe(false);
    expect(inService({ line: '17', tripId: null })).toBe(true);
    expect(inService({ line: null, tripId: 'NAV_1' })).toBe(true);
  });
});
