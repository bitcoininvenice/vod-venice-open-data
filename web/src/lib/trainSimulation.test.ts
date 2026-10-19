import { describe, it, expect } from 'vitest';
import trainsJson from '@/data/trains-venezia.json';
import {
  dateForDayType,
  getSimulatedTrainsAtTime,
  interpolateTrackPosition,
  setTrainSchedule,
  trainsOnDate,
  type TrainScheduleData,
} from './trainSimulation';

const schedule = trainsJson as unknown as TrainScheduleData;
setTrainSchedule(schedule);
// terzo giorno del file: dentro il periodo coperto
const ymd = new Date(Date.UTC(+schedule.startDate.slice(0, 4), +schedule.startDate.slice(4, 6) - 1, +schedule.startDate.slice(6, 8) + 2))
  .toISOString()
  .slice(0, 10)
  .replace(/-/g, '');
const today = trainsOnDate(ymd);
const at = (sec: number) => getSimulatedTrainsAtTime(sec, undefined, ymd);

describe('trainSimulation', () => {
  it("usa l'orario ufficiale della data: Trenitalia e Italo, nessun treno fuori dal periodo coperto", () => {
    expect(today.some((t) => t.operator === 'Italo')).toBe(true);
    expect(today.some((t) => t.operator === 'Trenitalia')).toBe(true);
    expect(trainsOnDate('20990101')).toEqual([]);
    expect(getSimulatedTrainsAtTime(9 * 3600, undefined, '20990101')).toEqual([]);
    // lunedì 19/10/2026: la domenica da mostrare è il 25
    expect(dateForDayType('sunday', new Date(Date.UTC(2026, 9, 19, 10)))).toBe('20261025');
    expect(dateForDayType('weekday', new Date(Date.UTC(2026, 9, 19, 10)))).toBe('20261019');
  });

  it('copre mattino, pomeriggio e sera', () => {
    expect(today.some((t) => t.departureSeconds >= 7 * 3600 && t.departureSeconds <= 9 * 3600)).toBe(true);
    expect(today.some((t) => t.departureSeconds >= 14 * 3600 && t.departureSeconds <= 16 * 3600)).toBe(true);
    expect(today.some((t) => t.departureSeconds >= 22 * 3600)).toBe(true);
  });

  it('interpola la posizione lungo il tracciato con offset laterale', () => {
    const ptCenter = interpolateTrackPosition(4000, 0);
    const ptTrackLeft = interpolateTrackPosition(4000, -5.6);
    const ptTrackRight = interpolateTrackPosition(4000, 5.6);

    expect(ptCenter.lon).toBeGreaterThan(12.2);
    expect(ptCenter.lat).toBeGreaterThan(45.4);
    expect(ptTrackLeft.lon).not.toBe(ptTrackRight.lon);
    expect(Math.abs(ptTrackLeft.lon - ptTrackRight.lon)).toBeLessThan(0.0005);
  });

  it('mette sul Ponte della Libertà i treni in viaggio secondo orario, con la velocità media da orario', () => {
    const trains = at(8 * 3600 + 15 * 60);
    const inTransit = trains.filter((t) => t.status === 'IN_TRANSITO');
    expect(inTransit.length).toBeGreaterThan(0);
    for (const tr of inTransit) {
      expect(tr.speedKmh).toBeGreaterThan(0);
      expect(tr.speedKmh).toBeLessThan(120);
      expect(tr.lat).toBeGreaterThan(45.43);
      expect(tr.lat).toBeLessThan(45.49);
      expect(tr.lon).toBeGreaterThan(12.22);
      expect(tr.lon).toBeLessThan(12.33);
      expect(today.some((t) => t.trainNumber === tr.trainNumber)).toBe(true);
    }
  });

  it('orienta i treni verso Santa Lucia o verso la terraferma', () => {
    const byNumber = new Map(today.map((t) => [t.trainNumber, t]));
    for (const tr of at(9 * 3600 + 15 * 60).filter((t) => t.status === 'IN_TRANSITO')) {
      const inbound = byNumber.get(tr.trainNumber)?.direction === 'INBOUND';
      if (inbound) {
        expect(tr.bearing).toBeGreaterThanOrEqual(100);
        expect(tr.bearing).toBeLessThanOrEqual(140);
      } else {
        expect(tr.bearing).toBeGreaterThanOrEqual(280);
        expect(tr.bearing).toBeLessThanOrEqual(320);
      }
    }
  });

  it('segue lo scorrimento della timeline', () => {
    const t1 = at(10 * 3600 + 14 * 60);
    const t2 = at(10 * 3600 + 16 * 60);
    const moving = t1.find((a) => a.status === 'IN_TRANSITO' && t2.some((b) => b.id === a.id && b.status === 'IN_TRANSITO'));
    if (moving) {
      const later = t2.find((b) => b.id === moving.id)!;
      expect(later.lon).not.toBe(moving.lon);
    }
  });

  it('integra i nodi fissi RFI se forniti come override', () => {
    const fixedNode = {
      id: 'RFI_SANTA_LUCIA',
      trainNumber: 'Stazione di Venezia Santa Lucia (RFI)',
      trainType: 'FRECCIAROSSA' as const,
      origin: 'Venezia',
      destination: 'Milano',
      currentLocation: 'Santa Lucia',
      lat: 45.4412,
      lon: 12.321,
      platform: 'Binario 1',
    };
    const trains = getSimulatedTrainsAtTime(12 * 3600, [fixedNode], ymd);
    expect(trains.some((t) => t.id === 'RFI_SANTA_LUCIA')).toBe(true);
  });
});
