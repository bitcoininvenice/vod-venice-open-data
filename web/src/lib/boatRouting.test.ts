import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOAT_URL, BOAT_STATS } from './boat-data';
import { ASSUMED_KMH, buildBoatGraph, ordinancesOnRoute, planBoat, ruleActive, type BoatRule, type RawBoat } from './boatRouting';
import type { OrdinanceItem } from './contracts/ordinances';

/**
 * Rete di prova in laguna aperta (fuori dalle zone urbane): 0 —A— 1 —A— 2 diretto, 0 —B— 3 —B— 2 giro lungo.
 * Coordinate intere in 1e-5 gradi; maxspeed OSM 10 km/h.
 */
function toy(rules: BoatRule[]): RawBoat {
  return {
    origin: [12.2, 45.3],
    scale: 100_000,
    nodes: [0, 0, 1000, 0, 2000, 0, 1000, 1500],
    edges: [0, 1, 7800, 0, 100, 1, 2, 7800, 0, 100, 0, 3, 14000, 1, 100, 3, 2, 14000, 1, 100],
    names: ['Canale A', 'Canale B'],
    geom: [[], [], [], []],
    rules,
    rulesUrl: 'https://example.org',
  };
}
const A = { lon: 12.2, lat: 45.3 };
const C = { lon: 12.22, lat: 45.3 };
const names = (r: ReturnType<typeof planBoat>) => (r.ok ? r.plan.stretches.map((s) => s.name) : null);

describe('ruleActive', () => {
  it('fasce orarie e giorni', () => {
    const r = { hours: [480, 720] as [number, number], days: 'lunven' as const };
    expect(ruleActive(r, 9 * 3600, 'weekday')).toBe(true);
    expect(ruleActive(r, 12 * 3600, 'weekday')).toBe(false);
    expect(ruleActive(r, 9 * 3600, 'saturday')).toBe(false);
    expect(ruleActive({ days: 'feriali' }, 9 * 3600, 'saturday')).toBe(true);
    expect(ruleActive({ days: 'feriali' }, 9 * 3600, 'sunday')).toBe(false);
    expect(ruleActive({}, 3 * 3600, 'sunday')).toBe(true);
  });
});

describe('planBoat su una rete di prova', () => {
  it('senza regole prende la strada diretta, al limite OSM', () => {
    const r = planBoat(buildBoatGraph(toy([])), A, C, 36000, 'weekday', { resident: false });
    expect(names(r)).toEqual(['Canale A']);
    if (r.ok) {
      expect(Math.round(r.plan.arrive - r.plan.depart)).toBe(Math.round(1560 / (10 / 3.6)));
      expect(r.plan.osmLimitMeters).toBeCloseTo(1560);
      expect(r.plan.assumedMeters).toBe(0);
    }
  });

  it('senso unico: consentito solo nel verso indicato', () => {
    const g = buildBoatGraph(toy([{ id: 'ow', kind: 'oneway', ref: 'art. 7', label: 'A da 2 verso 1', edges: [~1] }]));
    const there = planBoat(g, A, C, 36000, 'weekday', { resident: false });
    expect(names(there)).toEqual(['Canale B']);
    expect(there.ok && there.plan.avoided.map((r) => r.id)).toEqual(['ow']);
    const back = planBoat(g, C, A, 36000, 'weekday', { resident: false });
    expect(names(back)).toEqual(['Canale A']);
    expect(back.ok && back.plan.onRoute.map((r) => r.id)).toEqual(['ow']);
  });

  it('divieto a orario: vale solo nella fascia e nei giorni indicati', () => {
    const g = buildBoatGraph(toy([{ id: 'np', kind: 'noPleasure', ref: 'art. 20', label: 'A vietato 8-12', hours: [480, 720], days: 'lunven', edges: [0] }]));
    expect(names(planBoat(g, A, C, 9 * 3600, 'weekday', { resident: true }))).toEqual(['Canale B']);
    expect(names(planBoat(g, A, C, 13 * 3600, 'weekday', { resident: true }))).toEqual(['Canale A']);
    expect(names(planBoat(g, A, C, 9 * 3600, 'sunday', { resident: true }))).toEqual(['Canale A']);
  });

  it('senza strada consentita e con i punti lontani dall\'acqua', () => {
    const g = buildBoatGraph(toy([{ id: 'nm', kind: 'noMotor', ref: 'art. 8', label: 'tutto vietato', edges: [1, 3] }]));
    expect(planBoat(g, A, C, 36000, 'weekday', { resident: true })).toEqual({ ok: false, reason: 'restricted' });
    expect(planBoat(g, A, { lon: 12.3, lat: 45.3 }, 36000, 'weekday', { resident: true })).toEqual({ ok: false, reason: 'farFromWater' });
  });

  it('velocità ipotizzata dove il limite non è noto', () => {
    const raw = toy([]);
    raw.edges = raw.edges.map((v, i) => (i % 5 === 4 ? 0 : v));
    const r = planBoat(buildBoatGraph(raw), A, C, 0, 'weekday', { resident: false });
    expect(r.ok && Math.round(r.plan.arrive)).toBe(Math.round(1560 / (ASSUMED_KMH / 3.6)));
    expect(r.ok && r.plan.assumedMeters).toBeCloseTo(1560);
  });
});

describe('planBoat sulla rete reale (OpenStreetMap + Testo Unico)', () => {
  const g = buildBoatGraph(JSON.parse(readFileSync(join(__dirname, '../../public', BOAT_URL), 'utf8')) as RawBoat);
  const P = {
    roma: { lon: 12.3195, lat: 45.439 },
    zaccaria: { lon: 12.3423, lat: 45.4332 },
    accademia: { lon: 12.3283, lat: 45.4318 },
    zattereVio: { lon: 12.3287, lat: 45.4274 },
    sanLio: { lon: 12.3384, lat: 45.4388 },
    tronchetto: { lon: 12.306, lat: 45.44 },
    lido: { lon: 12.3703, lat: 45.4185 },
  };
  const ruleIds = (rules: BoatRule[]) => rules.map((r) => r.id);

  it('tutte le regole del Testo Unico sono collegate ai canali', () => {
    expect(BOAT_STATS.rules).toBe(29);
    expect(g.rules.filter((r) => r.kind === 'oneway')).toHaveLength(19);
  });

  it('Rio di San Vio: dal Canal Grande verso la Giudecca sì, al contrario no', () => {
    const down = planBoat(g, P.accademia, P.zattereVio, 14 * 3600, 'weekday', { resident: true });
    expect(names(down)).toContain('Rio de San Vio');
    const up = planBoat(g, P.zattereVio, P.accademia, 14 * 3600, 'weekday', { resident: true });
    expect(names(up)).not.toContain('Rio de San Vio');
    expect(up.ok && ruleIds(up.plan.avoided)).toContain('ow-vio');
  });

  it('senza residenza né concessione: niente ZTL', () => {
    expect(planBoat(g, P.sanLio, P.zaccaria, 14 * 3600, 'weekday', { resident: false })).toEqual({ ok: false, reason: 'restricted' });
    const r = planBoat(g, P.tronchetto, P.lido, 9 * 3600, 'weekday', { resident: false });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.plan.stretches.map((s) => s.name)).toContain('Canale della Giudecca');
      expect(r.plan.stretches.some((s) => s.name === 'Canal Grande' || /^Rio /.test(s.name ?? ''))).toBe(false);
    }
  });

  it('con +120 cm di marea i rii del centro storico sono vietati a motore', () => {
    const dry = planBoat(g, P.sanLio, P.zaccaria, 14 * 3600, 'weekday', { resident: true });
    const wet = planBoat(g, P.sanLio, P.zaccaria, 14 * 3600, 'weekday', { resident: true, tideCm: 120 });
    expect(dry.ok && dry.plan.stretches.some((s) => /^Rio /.test(s.name ?? ''))).toBe(true);
    expect(wet.ok).toBe(true);
    if (wet.ok) {
      expect(wet.plan.stretches.some((s) => /^Rio /.test(s.name ?? ''))).toBe(false);
      expect(wet.plan.tideRule).toBe('noMotor');
    }
  });

  it('segnala le ordinanze in vigore sui canali del percorso', () => {
    const r = planBoat(g, P.accademia, P.zattereVio, 14 * 3600, 'weekday', { resident: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const base = { number: '1', date: '2026-10-01', title: 'Chiusura', ambito: 'Traffico acqueo', luogo: '', validFrom: null, validTo: null, kind: 'closure', placeName: null, lat: null, lon: null, positionSource: 'canal', url: 'https://www.comune.venezia.it', pdfUrl: null } as const;
    const ords: OrdinanceItem[] = [
      { ...base, id: 'a', status: 'active', canalName: 'Rio de San Vio' },
      { ...base, id: 'b', status: 'upcoming', canalName: 'Rio de San Vio' },
      { ...base, id: 'c', status: 'active', canalName: 'Rio di Noale' },
    ];
    expect(ordinancesOnRoute(r.plan, ords).map((o) => o.id)).toEqual(['a']);
  });
});
