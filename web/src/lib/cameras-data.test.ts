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

  it('include le 11 webcam ufficiali CPSM con snapshot e attribuzione corretta', () => {
    const cpsm = VENICE_CAMERAS.filter((c) => c.source === 'CPSM_COMUNE_VENEZIA');
    expect(cpsm.length).toBe(11);
    expect(cpsm.every((c) => c.operator === 'Comune di Venezia – CPSM')).toBe(true);
    expect(cpsm.every((c) => c.lat >= 45.2 && c.lat <= 45.6 && c.lon >= 12.2 && c.lon <= 12.5)).toBe(true);
    const withSnapshots = cpsm.filter((c) => c.feedType === 'IMAGE_SNAPSHOT_15M');
    expect(withSnapshots.length).toBe(10);
    expect(withSnapshots.every((c) => c.snapshotUrl?.startsWith('https://www.comune.venezia.it/sites/default/files/publicCPSM2/webcam/'))).toBe(true);
  });
});
