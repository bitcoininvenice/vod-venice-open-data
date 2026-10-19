import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isMestreStation, matchesMestreStation, MESTRE_STATION, nextTrains, planMestre, SANTA_LUCIA, PIAZZALE_ROMA } from './mestrePlanner';
import { setTrainSchedule, type TrainScheduleData } from './trainSimulation';
import trainsJson from '@/data/trains-venezia.json';
import { SIM_URL } from './simulation-data';
import { WALK_URL } from './walk-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildWalkGraph, type RawWalk } from './walkGraph';
import { ACTV_STOPS_REFERENCE } from './stopsReference';

const publicDir = existsSync(path.join(process.cwd(), 'public')) ? path.join(process.cwd(), 'public') : path.join(process.cwd(), 'web', 'public');
const read = (url: string) => JSON.parse(readFileSync(path.join(publicDir, url), 'utf8'));
const sim = buildSimulation(read(SIM_URL) as RawSimulation);
const graph = buildWalkGraph(read(WALK_URL) as RawWalk);
const schedule = trainsJson as unknown as TrainScheduleData;
setTrainSchedule(schedule);
// un giorno feriale coperto dal file dell'orario
const day = (() => {
  for (let i = 1; i < schedule.trains[0].days.length; i++) {
    const d = new Date(Date.UTC(+schedule.startDate.slice(0, 4), +schedule.startDate.slice(4, 6) - 1, +schedule.startDate.slice(6, 8) + i, 10));
    if (d.getUTCDay() >= 1 && d.getUTCDay() <= 5) return d;
  }
  throw new Error('nessun giorno feriale nel file');
})();
const ymd = day.toISOString().slice(0, 10).replace(/-/g, '');

describe('mestrePlanner', () => {
  it('riconosce Mestre Stazione FS da coordinate e da stringhe di ricerca', () => {
    expect(isMestreStation(MESTRE_STATION)).toBe(true);
    expect(isMestreStation(SANTA_LUCIA)).toBe(false);

    expect(matchesMestreStation('mestre')).toBe(true);
    expect(matchesMestreStation('Mestre Stazione')).toBe(true);
    expect(matchesMestreStation('stazione di mestre')).toBe(true);
    expect(matchesMestreStation('mestre fs')).toBe(true);
    expect(matchesMestreStation('venezia mestre')).toBe(true);
    expect(matchesMestreStation('San Marco')).toBe(false);
  });

  it('trova i prossimi treni tra Santa Lucia e Mestre dall\'orario ufficiale', () => {
    const morningSec = 8 * 3600; // 08:00
    const outboundTrains = nextTrains(morningSec, true, 4, ymd);
    expect(outboundTrains.length).toBeGreaterThan(0);
    expect(outboundTrains[0].departureSeconds).toBeGreaterThanOrEqual(morningSec);
    expect(outboundTrains[0].direction).toBe('OUTBOUND');

    const inboundTrains = nextTrains(morningSec, false, 4, ymd);
    expect(inboundTrains.length).toBeGreaterThan(0);
    expect(inboundTrains[0].direction).toBe('INBOUND');
    // fuori dal periodo del file nessun treno: niente orario inventato
    expect(nextTrains(morningSec, true, 4, '20990101')).toEqual([]);
  });

  it('calcola le opzioni per Mestre Stazione solo da orari ufficiali (treni, ACTV), senza corse cadenzate inventate', () => {
    const morningSec = 8 * 3600; // 08:00
    const itineraries = planMestre(graph, sim, ACTV_STOPS_REFERENCE, PIAZZALE_ROMA, MESTRE_STATION, morningSec, 'weekday', { date: day });

    expect(itineraries.length).toBeGreaterThan(0);
    const vias = itineraries.map((i) => i.via);
    expect(vias.some((v) => v === 'treno_regionale' || v === 'treno_av')).toBe(true);
    expect(vias).not.toContain('bus_actv');
    expect(vias).not.toContain('busitalia');
    const train = itineraries.find((i) => i.via === 'treno_regionale' || i.via === 'treno_av');
    const leg = train?.legs.find((l) => l.kind === 'ride' && l.category === 'train');
    expect(leg && leg.kind === 'ride' && schedule.trains.some((t) => t.trainNumber === leg.line)).toBe(true);
  });
});
