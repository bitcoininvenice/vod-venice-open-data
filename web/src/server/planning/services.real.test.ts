import { describe, expect, it } from 'vitest';
import { departuresService, findPlaceService, planTripService } from './services';
import { contrastRatio, MIN_CONTRAST } from '@/lib/lineColors';

/** Mercoledì feriale dentro la validità degli orari ACTV e Alilaguna */
const WEEKDAY = '2026-11-25';
const HEX = /^#[0-9A-F]{6}$/;

type Colored = { color: string | null; textColor: string | null };
type Departure = Colored & { line: string; operator: string; category: string; direction: string; stop: string };

function expectValidColors(items: Colored[]) {
  for (const d of items) {
    expect(d).toHaveProperty('color');
    expect(d).toHaveProperty('textColor');
    if (d.color === null) {
      expect(d.textColor).toBeNull();
      continue;
    }
    expect(d.color).toMatch(HEX);
    expect(d.textColor).toMatch(HEX);
    expect(contrastRatio(d.color, d.textColor!)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }
}

async function departures(input: Parameters<typeof departuresService>[0]) {
  const r = await departuresService(input);
  if (!r.ok) throw new Error(r.message);
  return r.body as { departures: Departure[]; stops: string[]; nextRun?: Record<string, unknown>; filters?: unknown };
}

describe('stop_departures con l\'orario reale', () => {
  it('F.te Nove: partenze da tutti i pontili (A, B, C, D)', async () => {
    const b = await departures({ stop: 'F.te Nove', date: WEEKDAY, time: '16:30', minutes: 60 });
    const lines = new Set(b.departures.map((d) => d.line));
    for (const l of ['4.1', '4.2', '5.1', '5.2', '12', '13']) expect(lines, `linea ${l}`).toContain(l);
    expect(b.departures.every((d) => d.stop === 'F.te Nove' || d.operator === 'Alilaguna')).toBe(true);
    expectValidColors(b.departures);
  });

  it('S. Marco-San Zaccaria: colori ufficiali e capolinea comprensibile', async () => {
    const b = await departures({ stop: 'S. Marco-San Zaccaria', date: WEEKDAY, time: '10:00', minutes: 30 });
    const byLine = new Map(b.departures.map((d) => [d.line, d]));
    expect(byLine.get('1')).toMatchObject({ color: '#FFFFFF', textColor: '#000000' });
    // bianco su rosso (GTFS) ha contrasto 4,0:1: il testo diventa nero (5,25:1)
    expect(byLine.get('2')).toMatchObject({ color: '#FF0000', textColor: '#000000' });
    expect(byLine.get('5.2')?.color).toBe('#8FD2BF');
    expect(byLine.get('20')?.color).toBe('#C7AAD1');
    expect(b.departures.some((d) => /CORSIA/i.test(d.direction))).toBe(false);
    expect(b.departures.filter((d) => d.line === '1').map((d) => d.direction)).toContain('P.le Roma');
    expectValidColors(b.departures);
  });

  it('filtri facoltativi: operatore, categoria, linea', async () => {
    const one = await departures({ stop: 'F.te Nove', date: WEEKDAY, time: '16:30', minutes: 60, line: '4.1' });
    expect(one.departures.length).toBeGreaterThan(0);
    expect(one.departures.every((d) => d.line === '4.1')).toBe(true);
    expect(one.filters).toEqual({ operator: null, category: null, line: '4.1' });
    const nav = await departures({ stop: 'Piazzale Roma', date: WEEKDAY, time: '10:00', minutes: 30, category: ['vaporetto', 'motoscafo', 'motonave'] });
    expect(nav.departures.length).toBeGreaterThan(0);
    expect(nav.departures.every((d) => ['vaporetto', 'motoscafo', 'motonave'].includes(d.category))).toBe(true);
    const ali = await departures({ stop: 'F.te Nove', date: WEEKDAY, time: '10:00', minutes: 120, operator: 'Alilaguna' });
    expect(ali.departures.every((d) => d.operator === 'Alilaguna')).toBe(true);
    expectValidColors(ali.departures);
    // senza corse nella finestra: la prossima della linea richiesta
    const late = await departures({ stop: 'F.te Nove', date: WEEKDAY, time: '23:50', minutes: 10, line: '4.1' });
    if (late.departures.length === 0) expect(late.nextRun?.line).toBe('4.1');
  });
});

describe('plan_trip: colori dei tratti in vaporetto', () => {
  it('Ferrovia → Arsenale via acqua', async () => {
    const r = await planTripService({ from: 'Ferrovia', to: 'Arsenale', mode: 'water', date: WEEKDAY, time: '10:00' });
    expect(r.ok).toBe(true);
    const its = (r as unknown as { body: { itineraries: { legs: (Colored & { type: string; category?: string })[] }[] } }).body.itineraries;
    expect(its.length).toBeGreaterThan(0);
    for (const it of its) {
      for (const leg of it.legs) {
        if (leg.type === 'mezzo') {
          expect(leg.color).toMatch(HEX);
          expectValidColors([leg]);
        } else {
          expect(leg).not.toHaveProperty('color');
        }
      }
    }
  });
});

describe('find_place: nomi comuni dei pontili', () => {
  const cases: [string, string][] = [
    ['San Zaccaria', 'S. Marco-San Zaccaria'],
    ['Fondamente Nove', 'F.te Nove'],
    ['San Marco Vallaresso', 'S. Marco Vallaresso'],
    ['San Marco Giardinetti', 'S. Marco Giardinetti'],
    ['San Tomà', "S. Toma'"],
    ["Sant'Elena", 'S.Elena-Stadio Penzo'],
    ['San Giorgio', 'S. Giorgio'],
  ];
  for (const [query, stop] of cases) {
    it(`${query} → ${stop}`, () => {
      const r = findPlaceService(query);
      expect(r.ok).toBe(true);
      const body = (r as unknown as { body: { place: { kind: string; label: string; lat: number }; stops: { name: string }[] } }).body;
      expect(body.place).toMatchObject({ kind: 'stop', label: stop });
      // non al Lido (sotto 45.42 di latitudine)
      expect(body.place.lat).toBeGreaterThan(45.42);
      expect(body.stops[0].name).toBe(stop);
    });
  }
});
