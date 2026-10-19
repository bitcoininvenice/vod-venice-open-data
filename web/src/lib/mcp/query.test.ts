import { describe, expect, it } from 'vitest';
import { applyQuery, distanceMeters, MAX_RESPONSE_CHARS } from './query';
import { MCP_DATASETS } from './catalog';

const items = [
  { name: 'Farmacia Rialto', lat: 45.438, lon: 12.3358 },
  { name: 'Farmacia San Marco', lat: 45.4341, lon: 12.3388 },
  { name: 'Farmacia Lido', lat: 45.405, lon: 12.365 },
  { name: 'Senza coordinate' },
];

describe('applyQuery', () => {
  it('filtra per testo senza distinguere maiuscole', () => {
    const r = applyQuery(items, { text: 'rialto', limit: 10, offset: 0 });
    expect(r.matched).toBe(1);
    expect(r.items[0].name).toBe('Farmacia Rialto');
  });

  it('filtra per distanza, ordina dal più vicino e scarta le voci senza coordinate', () => {
    const r = applyQuery(items, { near: { lat: 45.4341, lon: 12.3388, radiusMeters: 1000 }, limit: 10, offset: 0 });
    expect(r.items.map((i) => i.name)).toEqual(['Farmacia San Marco', 'Farmacia Rialto']);
    expect(r.items[0].distanceMeters).toBe(0);
  });

  it('pagina e riporta i totali', () => {
    const r = applyQuery(items, { limit: 2, offset: 1 });
    expect(r).toMatchObject({ total: 4, matched: 4, offset: 1, returned: 2 });
  });

  it('riduce le risposte troppo grandi', () => {
    const big = Array.from({ length: 50 }, (_, i) => ({ id: i, blob: 'x'.repeat(10_000) }));
    const r = applyQuery(big, { limit: 50, offset: 0 });
    expect(r.truncatedForSize).toBe(true);
    expect(JSON.stringify(r.items).length).toBeLessThanOrEqual(MAX_RESPONSE_CHARS);
  });

  it('calcola le distanze in metri', () => {
    expect(distanceMeters(45.4341, 12.3388, 45.438, 12.3358)).toBeGreaterThan(450);
    expect(distanceMeters(45.4341, 12.3388, 45.438, 12.3358)).toBeLessThan(520);
  });

  it('filtra gli edifici per epoca (minYear / maxYear) e per architetto', () => {
    const buildings = [
      { name: 'Palazzo Ducale', year: 1340, architect: null },
      { name: "Ca' d'Oro", year: 1421, architect: null },
      { name: 'Fondazione Querini Stampalia', year: 1528, contemporaryYear: 1963, architect: 'Carlo Scarpa' },
      { name: 'Negozio Olivetti', year: 1538, contemporaryYear: 1958, architect: 'Carlo Scarpa' },
      { name: 'Casa alle Zattere', year: 1958, contemporaryYear: 1958, architect: 'Ignazio Gardella' },
    ];
    const pre1500 = applyQuery(buildings, { maxYear: 1499, limit: 10, offset: 0 });
    expect(pre1500.items.map((b) => b.name)).toEqual(['Palazzo Ducale', "Ca' d'Oro"]);

    const scarpa = applyQuery(buildings, { text: 'Carlo Scarpa', limit: 10, offset: 0 });
    expect(scarpa.items.map((b) => b.name)).toEqual(['Fondazione Querini Stampalia', 'Negozio Olivetti']);
  });
});

describe('catalogo MCP', () => {
  it('ha id unici e dichiara natura, fonte e licenza', () => {
    const ids = MCP_DATASETS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of MCP_DATASETS) {
      expect(d.source.length).toBeGreaterThan(2);
      expect(d.license.length).toBeGreaterThan(0);
      expect(['live', 'forecast', 'simulated', 'dataset', 'osm', 'curated']).toContain(d.kind);
    }
  });
});

describe('loader MCP', () => {
  it('ogni dataset del catalogo ha un loader e viceversa', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('./loaders.ts', import.meta.url), 'utf8');
    const block = src.slice(src.indexOf('export const MCP_LOADERS'));
    const keys = [...block.matchAll(/^ {2}([a-z_]+): async/gm)].map((m) => m[1]).sort();
    expect(keys).toEqual(MCP_DATASETS.map((d) => d.id).sort());
  });
});
