import { describe, expect, it } from 'vitest';
import dataset from '@/data/osm-waterways.json';
import { canalLengthMeters, pointSegmentDistance, type LagoonNetwork } from './lagoonNetwork';

const net = dataset as unknown as LagoonNetwork;

describe('rete lagunare OpenStreetMap', () => {
  it('ha migliaia di briccole e centinaia di canali, con licenza ODbL', () => {
    expect(net.license).toBe('ODbL 1.0');
    expect(net.counts.briccola).toBeGreaterThan(1000);
    expect(net.canals.length).toBeGreaterThan(300);
    expect(net.markers.length).toBe(net.counts.briccola + net.counts.palo + net.counts.segnale + net.counts.boa + net.counts.fanale);
  });

  it('i punti stanno nella cornice della mappa', () => {
    for (const [lon, lat] of net.markers) {
      expect(lon).toBeGreaterThanOrEqual(12.13);
      expect(lon).toBeLessThanOrEqual(12.48);
      expect(lat).toBeGreaterThanOrEqual(45.2);
      expect(lat).toBeLessThanOrEqual(45.56);
    }
  });

  it('calcola lunghezze e distanze', () => {
    expect(canalLengthMeters([[12.33, 45.43], [12.33, 45.44]])).toBeCloseTo(1105.4, 0);
    expect(pointSegmentDistance(5, 5, 0, 0, 10, 0)).toBe(5);
    expect(pointSegmentDistance(-3, 4, 0, 0, 10, 0)).toBe(5);
  });
});
