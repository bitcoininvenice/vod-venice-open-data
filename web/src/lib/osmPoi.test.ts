import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters } from './geo';
import { OPEN_EV_CHARGING, OPEN_MONUMENTAL_TREES, OPEN_PARKINGS, OPEN_WELLS, OSM_POI_META, curatedNotInOsm } from './osmPoi';

describe('curatedNotInOsm', () => {
  it('tiene solo le voci curate senza un punto OSM entro il raggio', () => {
    const osm = [{ lat: 45.4371, lon: 12.3326 }];
    const near = { lat: 45.4372, lon: 12.3327 }; // circa 13 m
    const far = { lat: 45.44, lon: 12.34 };
    expect(curatedNotInOsm([near, far], osm, 50)).toEqual([far]);
  });
});

describe('POI OpenStreetMap', () => {
  it('ogni voce dichiara la provenienza e i punti OSM hanno il link', () => {
    for (const item of [...OPEN_EV_CHARGING, ...OPEN_PARKINGS, ...OPEN_MONUMENTAL_TREES, ...OPEN_WELLS]) {
      expect(['OPENSTREETMAP', 'ELENCO_CURATO']).toContain(item.source);
      if (item.source === 'OPENSTREETMAP') expect(item.sourceUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\//);
    }
    expect(OPEN_EV_CHARGING.filter((e) => e.source === 'OPENSTREETMAP')).toHaveLength(OSM_POI_META.counts.evCharging);
  });

  it('i parcheggi curati restanti non duplicano un parcheggio OSM entro 150 m', () => {
    const osm = OPEN_PARKINGS.filter((p) => p.source === 'OPENSTREETMAP');
    for (const c of OPEN_PARKINGS.filter((p) => p.source === 'ELENCO_CURATO')) {
      expect(osm.every((o) => calculateDistanceMeters(c.lat, c.lon, o.lat, o.lon) > 150)).toBe(true);
    }
  });

  it('le vere da pozzo curate indicano se la posizione è confermata da OSM', () => {
    const curated = OPEN_WELLS.filter((w) => w.source === 'ELENCO_CURATO');
    expect(curated.length).toBeGreaterThan(0);
    for (const w of curated) expect(typeof w.positionConfirmed).toBe('boolean');
  });
});
