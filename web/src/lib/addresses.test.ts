import { describe, expect, it } from 'vitest';
import toponyms from '@/data/osm-toponyms.json';
import civiciDataset from '@/data/osm-civici.json';
import { addressLabel, areaOf, buildAddressIndex, normalize, parseAddressQuery, searchAddresses } from './addresses';
import type { CivicRow } from './civici';

const civici = civiciDataset.civici as unknown as Record<string, CivicRow[]>;
const index = buildAddressIndex(toponyms.names as unknown as Record<string, [number, number][]>, civici);

describe('indirizzi', () => {
  it('normalizza accenti e punteggiatura', () => {
    expect(normalize("Fondamenta de l'Ospedaleto")).toBe('fondamenta de l ospedaleto');
    expect(normalize('Ponte de la Libertà')).toBe('ponte de la liberta');
  });

  it('riconosce la zona all\'inizio o alla fine', () => {
    expect(parseAddressQuery('cannaregio calle minestra')).toEqual({ area: 'Cannaregio', tokens: ['calle', 'minestra'] });
    expect(parseAddressQuery('Calle Minestra, San Polo')).toEqual({ area: 'San Polo', tokens: ['calle', 'minestra'] });
    expect(parseAddressQuery('calle della malvasia').tokens).toEqual(['calle', 'malvasia']);
  });

  it('zona dal civico più vicino o dall\'area', () => {
    const cn = civici.Cannaregio[0];
    expect(areaOf(cn[2], cn[3], civici)).toBe('Cannaregio');
    expect(areaOf(12.354, 45.457, {})).toBe('Murano');
    expect(areaOf(12.0, 45.0, {})).toBeNull();
  });

  it('trova calle Minestra anche con la zona sbagliata o incompleta', () => {
    const hits = searchAddresses(index, 'cannaregio calle minestra');
    expect(hits[0].name).toBe('Calle Minestra');
    expect(searchAddresses(index, 'calle mines').map((h) => h.name)).toContain('Calle Minestra');
    // grafie equivalenti
    expect(searchAddresses(index, 'fondamenta nove').map((h) => h.name)).toContain('Fondamente Nove');
    expect(addressLabel({ name: 'Calle Minestra', area: 'Dorsoduro', lon: 0, lat: 0 })).toBe('Calle Minestra, Dorsoduro');
  });

  it('la zona indicata viene prima', () => {
    const hits = searchAddresses(index, 'murano fondamenta', 20);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].area).toBe('Murano');
  });

  it('ricerche troppo corte o solo zona: nessun risultato', () => {
    expect(searchAddresses(index, 'ca')).toEqual([]);
    expect(searchAddresses(index, 'cannaregio')).toEqual([]);
  });
});
