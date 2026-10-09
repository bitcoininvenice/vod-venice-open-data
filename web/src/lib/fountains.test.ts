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
