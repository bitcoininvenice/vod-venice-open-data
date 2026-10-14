import { describe, expect, it } from 'vitest';
import { isPlacedOrdinance, ordinancesByCanal, ordinancesForCanal } from './canalOrdinances';
import type { OrdinanceItem } from './contracts/ordinances';

const base: OrdinanceItem = {
  id: '1', number: '700', date: '2026-10-07', title: 'Cantiere', ambito: 'Traffico acqueo', luogo: 'Venezia Città Storica',
  validFrom: '2026-10-07', validTo: '2026-10-31', status: 'active', kind: 'works', canalName: null, placeName: null,
  lat: null, lon: null, positionSource: null, url: 'https://www.comune.venezia.it/it/content/ordinanza?idPratica=1', pdfUrl: null,
};
// Rio dei Carmini (tratto semplificato) e un rio parallelo a ~80 m
const carmini: [number, number][] = [[12.3240, 45.4330], [12.3240, 45.4350]];
const other: [number, number][] = [[12.3250, 45.4330], [12.3250, 45.4350]];

describe('ordinanze sui canali', () => {
  it('il punto del Comune vale più del nome: solo il canale entro 30 m', () => {
    const o = { ...base, lat: 45.434, lon: 12.32402, positionSource: 'comune' as const, canalName: 'Rio X' };
    expect(ordinancesForCanal('Rio dei Carmini', carmini, [o])).toHaveLength(1);
    expect(ordinancesForCanal('Rio X', other, [o])).toHaveLength(0);
  });

  it('senza punto si usa il nome; solo il traffico acqueo colora i canali', () => {
    const byName = { ...base, canalName: 'Rio dei Carmini' };
    const works = { ...byName, id: '2', ambito: 'LLPP Venezia e Isole' };
    expect(ordinancesForCanal('Rio dei Carmini', carmini, [byName, works]).map((o) => o.id)).toEqual(['1']);
    const map = ordinancesByCanal([{ id: 10, name: 'Rio dei Carmini', coords: carmini }, { id: 11, name: null, coords: other }], [byName, works]);
    expect([...map.keys()]).toEqual([10]);
  });

  it('ordinanze con posizione per il livello', () => {
    expect(isPlacedOrdinance(base)).toBe(false);
    expect(isPlacedOrdinance({ ...base, lat: 45.43, lon: 12.33 })).toBe(true);
  });
});
