import { describe, it, expect } from 'vitest';
import fountainsDataset from '@/data/fountains.json';

describe('OpenStreetMap drinking fountains dataset', () => {
  it('contains valid fountain records with correct metadata', () => {
    expect(fountainsDataset.metadata).toBeDefined();
    expect(fountainsDataset.metadata.totalFountains).toBeGreaterThanOrEqual(140);
    expect(fountainsDataset.data).toBeInstanceOf(Array);
    expect(fountainsDataset.data.length).toBe(fountainsDataset.metadata.totalFountains);
  });

  it('ensures each fountain has valid geographic coordinates within Venice area', () => {
    for (const f of fountainsDataset.data) {
      expect(f.id).toMatch(/^fnt-\d+$/);
      expect(f.name).toBeTruthy();
      expect(f.type).toBe('FOUNTAIN');
      expect(f.sestiere).toBeTruthy();
      expect(f.lat).toBeGreaterThanOrEqual(45.24);
      expect(f.lat).toBeLessThanOrEqual(45.52);
      expect(f.lon).toBeGreaterThanOrEqual(12.28);
      expect(f.lon).toBeLessThanOrEqual(12.44);
      expect(f.details).toContain('OpenStreetMap');
      // nessun orario o certificazione attribuiti senza fonte
      expect(f.details).not.toMatch(/H24|certificat/i);
      expect(f.potable).toBe(true);
    }
  });

  it('covers all historic sestieri and main lagoon islands', () => {
    const sestieri = new Set(fountainsDataset.data.map((f) => f.sestiere));
    expect(sestieri).toContain('Castello');
    expect(sestieri).toContain('Cannaregio');
    expect(sestieri).toContain('San Marco');
    expect(sestieri).toContain('San Polo');
    expect(sestieri).toContain('Santa Croce');
    expect(sestieri).toContain('Dorsoduro');
    expect(sestieri).toContain('Giudecca & Sacca Fisola');
    expect(sestieri).toContain('Murano');
    expect(sestieri).toContain('Burano / Mazzorbo / Torcello');
    expect(sestieri).toContain('Lido di Venezia');
  });
});

describe('fontanelle Venice Tap Water + OpenStreetMap', async () => {
  const { OPEN_FOUNTAINS, VTW_FOUNTAINS, OPEN_CITY_ASSETS } = await import('./osmPoi');
  const { filterFountains, VENICE_TAP_WATER_URL } = await import('./fountainFilter');

  it('Venice Tap Water è la fonte primaria, con stato e link al sito', () => {
    expect(VTW_FOUNTAINS.length).toBeGreaterThanOrEqual(200);
    for (const f of VTW_FOUNTAINS) {
      expect(f.source).toBe('VENICE_TAP_WATER');
      expect(f.sourceUrl).toBe(VENICE_TAP_WATER_URL);
      expect(['open', 'closed', 'unknown']).toContain(f.status);
    }
    expect(VTW_FOUNTAINS.filter((f) => f.status === 'open').length).toBeGreaterThan(100);
    expect(VTW_FOUNTAINS.filter((f) => f.status === 'closed').length).toBeGreaterThan(50);
  });

  it('con "tutte" i doppioni OSM lasciano il posto a Venice Tap Water', () => {
    const all = filterFountains(OPEN_FOUNTAINS, 'all');
    const osm = filterFountains(OPEN_FOUNTAINS, 'osm');
    const vtw = filterFountains(OPEN_FOUNTAINS, 'vtw');
    const duplicates = osm.filter((f) => f.duplicateOf);
    expect(duplicates.length).toBeGreaterThan(50);
    expect(all.length).toBe(vtw.length + osm.length - duplicates.length);
    expect(all.some((f) => f.duplicateOf)).toBe(false);
    for (const d of duplicates) expect(vtw.some((v) => v.id === d.duplicateOf)).toBe(true);
    // i punti cittadini contano ogni fontana una volta sola
    expect(OPEN_CITY_ASSETS.filter((a) => a.type === 'FOUNTAIN').length).toBe(all.length);
  });
});
