import { describe, expect, it, vi } from 'vitest';
import trainsJson from '@/data/trains-venezia.json';
import { romeLocalToDate } from '@/lib/time';
import type { TrainScheduleData } from '@/lib/trainSimulation';

const schedule = trainsJson as unknown as TrainScheduleData;
// primo treno regionale da Santa Lucia, terzo giorno del file, e il suo ritardo nel feed simulato del test
const ymd = new Date(Date.UTC(+schedule.startDate.slice(0, 4), +schedule.startDate.slice(4, 6) - 1, +schedule.startDate.slice(6, 8) + 2))
  .toISOString()
  .slice(0, 10);
const train = schedule.trains.find((t) => t.direction === 'OUTBOUND' && t.operator === 'Trenitalia' && t.days[2] === '1' && t.departureSeconds > 8 * 3600)!;
const number = train.trainNumber.match(/\d{3,5}/)![0];
const depMs = romeLocalToDate(`${ymd} 00:00:00`).getTime() + train.departureSeconds * 1000;

vi.mock('@/server/upstream', () => ({
  fetchUpstream: vi.fn(async (url: string) => {
    if (url.includes('trenitalia/gtfs-rt/trip-updates')) {
      return {
        ok: true,
        data: [{ id: 'x', tripUpdate: { trip: { tripId: `0083_10083_0_v_1-${number}-31CE-0083` }, stopTimeUpdate: [{ stopId: '02593', departure: { delay: 240 } }] } }],
      };
    }
    if (url.includes('trenitalia/gtfs-rt/vehicle-positions')) {
      return {
        ok: true,
        data: [{ id: 'v1', vehicle: { trip: { tripId: `0083_10083_0_v_1-${number}-31CE-0083` }, position: { latitude: 45.46, longitude: 12.28, bearing: 300 } } }],
      };
    }
    return { ok: false, error: 'offline' };
  }),
}));

const { detectTrainType, fetchLiveTrainsInVenice, fetchStationBoard, isInVeniceFrame, trainNumbersOf } = await import('./busoneTrains');

describe('busoneTrains', () => {
  it('isInVeniceFrame riconosce le coordinate lagunari e metropolitane', () => {
    expect(isInVeniceFrame(12.321, 45.441)).toBe(true);
    expect(isInVeniceFrame(12.232, 45.482)).toBe(true);
    expect(isInVeniceFrame(12.5, 41.9)).toBe(false);
    expect(isInVeniceFrame(NaN, 45.44)).toBe(false);
  });

  it('detectTrainType e numeri del treno dagli id delle corse', () => {
    expect(detectTrainType('Italo 8972', 'Italo')).toBe('ITALO');
    expect(detectTrainType('FR 9735', 'Trenitalia')).toBe('FRECCIAROSSA');
    expect(detectTrainType('EC 84', 'Trenitalia')).toBe('EUROCITY');
    expect(trainNumbersOf('0083_10083_0_v_1-16306-31CE-0083_v_1-16306-31CE-0083')).toContain('16306');
    expect(trainNumbersOf('NTV-1021-8907')).toEqual(['1021', '8907']);
  });

  it("tabellone di Santa Lucia dall'orario ufficiale, con il ritardo del feed quando c'è e «da orario» altrimenti", async () => {
    const board = await fetchStationBoard('santa_lucia', depMs - 10 * 60_000);
    const row = board.departures.find((r) => r.trainNumber === train.trainNumber)!;
    expect(row).toBeDefined();
    expect(row.place).toBe(train.destination);
    expect(row.delayMinutes).toBe(4);
    expect(row.estimatedAt - row.scheduledAt).toBe(240_000);
    // gli altri treni senza dato in tempo reale restano «da orario», nessun ritardo inventato
    expect(board.departures.filter((r) => r.trainNumber !== train.trainNumber).every((r) => r.delayMinutes === null)).toBe(true);
    for (const r of [...board.departures, ...board.arrivals]) {
      expect(schedule.trains.some((t) => t.trainNumber === r.trainNumber)).toBe(true);
    }
  });

  it("fuori dal periodo dell'orario il tabellone è vuoto", async () => {
    const board = await fetchStationBoard('mestre', Date.UTC(2099, 0, 5, 9));
    expect(board.departures).toEqual([]);
    expect(board.arrivals).toEqual([]);
  });

  it("treni in tempo reale con origine e destinazione dall'orario, senza treni di riserva inventati", async () => {
    const res = await fetchLiveTrainsInVenice(depMs);
    expect(res.trains).toHaveLength(1);
    expect(res.trains[0]).toMatchObject({ trainNumber: train.trainNumber, destination: train.destination, operator: 'Trenitalia' });
  });
});
