import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { WALK_URL } from './walk-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildWalkGraph, type RawWalk } from './walkGraph';
import { planTrip } from './tripPlanner';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import { PASSERELLE_ROUTES } from './passerelleData';

const publicDir = existsSync(path.join(process.cwd(), 'public'))
  ? path.join(process.cwd(), 'public')
  : path.join(process.cwd(), 'web', 'public');
const read = (url: string) => JSON.parse(readFileSync(path.join(publicDir, url), 'utf8'));
const sim = buildSimulation(read(SIM_URL) as RawSimulation);
const graph = buildWalkGraph(read(WALK_URL) as RawWalk);


/** Luoghi di prova (coordinate approssimate di punti noti) */
const PLACES = {
  ferrovia: { lon: 12.3215, lat: 45.4412, label: 'Stazione Santa Lucia' },
  sanMarco: { lon: 12.3397, lat: 45.4341, label: 'Piazza San Marco' },
  rialto: { lon: 12.3359, lat: 45.438, label: 'Ponte di Rialto' },
  lido: { lon: 12.3700, lat: 45.4150, label: 'Lido, Gran Viale' },
  murano: { lon: 12.3530, lat: 45.4580, label: 'Murano, Colonna' },
  campoSantaMargherita: { lon: 12.3235, lat: 45.4345, label: 'Campo Santa Margherita' },
};

describe('trip planner con i dati reali', () => {
  for (const [a, b] of [['ferrovia', 'sanMarco'], ['rialto', 'lido'], ['ferrovia', 'murano'], ['campoSantaMargherita', 'rialto']] as const) {
    it(`${a} → ${b} alle 10:00 di un giorno feriale`, () => {
      const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES[a], PLACES[b], 10 * 3600, 'weekday');
      expect(r.best).not.toBeNull();
      expect(r.best!.arrive).toBeGreaterThan(10 * 3600);
      expect(r.best!.arrive - 10 * 3600).toBeLessThan(90 * 60);
      // ogni tratto inizia dove finisce il precedente, in ordine di tempo
      for (let i = 1; i < r.best!.legs.length; i++) expect(r.best!.legs[i].start).toBeGreaterThanOrEqual(r.best!.legs[i - 1].end - 1);
    });
  }

  it('Murano e Lido si raggiungono solo in vaporetto', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.murano, 10 * 3600, 'weekday');
    expect(r.walkOnly).toBeNull();
    expect(r.best!.legs.some((l) => l.kind === 'ride')).toBe(true);
  });
});

describe('planner con acqua alta e modalità', () => {
  const at = 10 * 3600;
  const tide = (cm: number | null) => () => cm;

  it('senza acqua alta il percorso non cambia e non segna acqua', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { tideAt: tide(70) });
    expect(r.floodLevelCm).toBeNull();
    expect(r.best!.wetMeters).toBe(0);
  });

  it('a +120 cm il percorso a piedi evita buona parte delle calli allagate', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.rialto, at, 'weekday', { mode: 'walk', tideAt: tide(120) });
    expect(r.floodLevelCm).toBe(120);
    expect(r.shortestWalkWetMeters).toBeGreaterThan(0);
    expect(r.best!.wetMeters).toBeLessThan(r.shortestWalkWetMeters!);
    expect(r.best!.maxDepthCm).toBeLessThanOrEqual(120 - 80);
  });

  it('le passerelle previste contano come transitabili', () => {
    const r1 = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.rialto, PLACES.sanMarco, at, 'weekday', { mode: 'walk', tideAt: tide(115) });
    const r2 = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.rialto, PLACES.sanMarco, at, 'weekday', { mode: 'walk', tideAt: tide(115), passerelle: PASSERELLE_ROUTES });
    expect(r2.best!.passerellaMeters).toBeGreaterThan(0);
    expect(r2.best!.wetMeters).toBeLessThanOrEqual(r1.best!.wetMeters);
  });

  it('modalità: solo a piedi non usa il vaporetto, preferisci via acqua cammina meno', () => {
    const walk = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { mode: 'walk' });
    expect(walk.best!.rides).toBe(0);
    const fastest = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday');
    const boat = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { mode: 'boat' });
    expect(boat.best!.rides).toBeGreaterThan(0);
    expect(boat.best!.walkMeters).toBeLessThanOrEqual(fastest.best!.walkMeters + 1);
  });

  it('segnala le corse con marea da MOSE', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.murano, at, 'weekday', { tideAt: tide(125) });
    expect(r.best!.ridesInHighWater).toBe(true);
  });

  it('di corsa: propone il vaporetto che parte prima di quanto serve a piedi, con il percorso normale se non si fa in tempo', () => {
    const point = { lon: 12.35374, lat: 45.45987, label: 'Murano, punto sulla mappa' };
    const fn = ACTV_STOPS_REFERENCE.find((s) => s.name === 'F.te Nove')!;
    const dest = { lon: fn.lon, lat: fn.lat, label: 'F.te Nove' };
    const now = 23 * 3600 + 52 * 60;
    const calm = planTrip(graph, sim, ACTV_STOPS_REFERENCE, point, dest, now, 'weekday', { nextDay: 'weekday' });
    const rushed = planTrip(graph, sim, ACTV_STOPS_REFERENCE, point, dest, now, 'weekday', { nextDay: 'weekday', hurry: true });
    expect(rushed.best?.hurry).toBeDefined();
    expect(rushed.best!.hurry!.departs).toBeGreaterThanOrEqual(now);
    expect(rushed.best!.arrive).toBeLessThan(calm.best!.arrive);
    expect(rushed.ifLate?.arrive).toBe(calm.best!.arrive);
    // con calma (o con un orario scelto) nessun avviso
    expect(calm.best?.hurry).toBeUndefined();
  });

  it('tutti i mezzi: dal Lido a Murano Colonna anche l\'Alilaguna, alternative dalla più veloce', () => {
    // darsena Alilaguna di Murano Colonna: la linea Blu ci va diretta dal Lido
    const colonna = { lon: 12.3504, lat: 45.4547, label: 'Murano Colonna' };
    const date = new Date('2026-10-14T10:00:00+02:00');
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.lido, colonna, 10 * 3600, 'weekday', { nextDay: 'weekday', date });
    const alts = r.alternatives ?? [];
    expect(alts.length).toBeGreaterThanOrEqual(1);
    expect(alts[0]).toBe(r.best);
    for (let i = 1; i < alts.length; i++) {
      // le alternative più lente hanno meno cambi
      expect(alts[i].arrive).toBeGreaterThan(alts[i - 1].arrive);
      expect(alts[i].rides).toBeLessThan(alts[i - 1].rides);
    }
    const all = alts.flatMap((a) => a.legs).filter((l) => l.kind === 'ride');
    expect(all.some((l) => l.kind === 'ride' && l.operator === 'alilaguna')).toBe(true);
    // senza data l'orario Alilaguna non si usa
    const noDate = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.lido, colonna, 10 * 3600, 'weekday', { nextDay: 'weekday' });
    expect((noDate.alternatives ?? []).flatMap((a) => a.legs).some((l) => l.kind === 'ride' && l.operator === 'alilaguna')).toBe(false);
  });

  it('itinerari coerenti: ogni tratto parte dopo la fine del precedente, al massimo 4 corse', () => {
    const date = new Date('2026-10-14T10:00:00+02:00');
    for (const [a, b] of [[PLACES.ferrovia, PLACES.lido], [PLACES.murano, PLACES.campoSantaMargherita], [PLACES.lido, PLACES.murano]] as const) {
      const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, a, b, 10 * 3600, 'weekday', { nextDay: 'weekday', date });
      for (const it of r.alternatives ?? []) {
        expect(it.rides).toBeLessThanOrEqual(4);
        for (let k = 1; k < it.legs.length; k++) expect(it.legs[k].start, `${a.label}→${b.label}`).toBeGreaterThanOrEqual(it.legs[k - 1].end - 1);
      }
    }
  });

  it('rete allargata: da Sottomarina alla Ferrovia via Pellestrina e Lido (barca 11, bus 11, vaporetto)', () => {
    const sottomarina = { lon: 12.29721, lat: 45.21658, label: 'Sottomarina' };
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, sottomarina, PLACES.ferrovia, 10 * 3600, 'weekday', { nextDay: 'weekday', date: new Date('2026-10-14T10:00:00+02:00') });
    expect(r.best).not.toBeNull();
    const lines = r.best!.legs.filter((l) => l.kind === 'ride').map((l) => (l.kind === 'ride' ? `${l.line}/${l.category}` : ''));
    expect(r.best!.rides).toBe(3);
    expect(lines[0]).toMatch(/^11\//);
    expect(lines).toContain('11/island');
    // fermata lontana: tratto a piedi oltre i 1500 m, entro il tentativo lungo
    expect(r.best!.legs[0].kind === 'walk' && r.best!.legs[0].meters).toBeGreaterThan(1500);
  });

  it('rete allargata: da Mestre a Murano con autobus e vaporetto, cambio a piedi a Piazzale Roma', () => {
    const mestre = { lon: 12.2405, lat: 45.4905, label: 'Mestre centro' };
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, mestre, PLACES.murano, 10 * 3600, 'weekday', { nextDay: 'weekday' });
    const rides = r.best!.legs.filter((l) => l.kind === 'ride');
    expect(rides.some((l) => l.kind === 'ride' && l.category === 'bus')).toBe(true);
    expect(rides.some((l) => l.kind === 'ride' && l.category !== 'bus')).toBe(true);
  });

  it('rete allargata: tempi di calcolo da telefono', () => {
    const mestre = { lon: 12.2405, lat: 45.4905, label: 'Mestre centro' };
    const t0 = performance.now();
    planTrip(graph, sim, ACTV_STOPS_REFERENCE, mestre, PLACES.lido, 10 * 3600, 'weekday', { nextDay: 'weekday', date: new Date('2026-10-14T10:00:00+02:00'), hurry: true });
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
