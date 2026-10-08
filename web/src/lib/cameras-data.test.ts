import { describe, expect, it } from 'vitest';
import { OSM_SURVEILLANCE_META, VENICE_CAMERAS } from './cameras-data';
import { calculateDistanceMeters } from './geo';

describe('catalogo telecamere', () => {
  const osm = VENICE_CAMERAS.filter((c) => c.source === 'OPENSTREETMAP');
  const anopticon = VENICE_CAMERAS.filter((c) => c.source === 'ANOPTICON_CIVIC');

  it('include tutte le telecamere OSM con attribuzione ODbL', () => {
    expect(osm.length).toBe(OSM_SURVEILLANCE_META.count);
    expect(OSM_SURVEILLANCE_META.license).toMatch(/ODbL/);
    expect(osm.every((c) => c.sourceUrl.startsWith('https://www.openstreetmap.org/node/'))).toBe(true);
  });

  it('non duplica voci Anopticon già presenti in OSM', () => {
    for (const a of anopticon) {
      expect(osm.some((o) => calculateDistanceMeters(a.lat, a.lon, o.lat, o.lon) <= 20)).toBe(false);
    }
  });

  it('id univoci e nessuna CCTV con flusso pubblico', () => {
    expect(new Set(VENICE_CAMERAS.map((c) => c.id)).size).toBe(VENICE_CAMERAS.length);
    expect(VENICE_CAMERAS.filter((c) => c.type.startsWith('CCTV_')).every((c) => !c.hasLiveFeed)).toBe(true);
  });
});
