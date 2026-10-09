import { describe, expect, it } from 'vitest';
import type { WindField } from '@/lib/types';
import { sampleWind, windColor, WIND_COLOR_STOPS } from './windLayer';

const field: WindField = {
  validTime: '2026-10-09T10:30', fetchedAt: '', source: '', sourceUrl: '', license: '',
  lon0: 12, lat0: 45, dLon: 1, dLat: 1, nx: 2, ny: 2,
  u: [0, 2, 0, 2], // cresce verso est
  v: [0, 0, 4, 4], // cresce verso nord
  maxSpeedMs: 0,
};

describe('vento animato', () => {
  it('interpola bilinearmente u e v', () => {
    expect(sampleWind(field, 12.5, 45.5)).toEqual([1, 2]);
    expect(sampleWind(field, 13, 46)).toEqual([2, 4]);
  });

  it('restituisce null fuori dalla griglia', () => {
    expect(sampleWind(field, 11.9, 45.5)).toBeNull();
    expect(sampleWind(field, 12.5, 46.1)).toBeNull();
  });

  it('usa la scala colori ai capi e interpola in mezzo', () => {
    expect(windColor(-1)).toEqual(WIND_COLOR_STOPS[0][1]);
    expect(windColor(99)).toEqual(WIND_COLOR_STOPS[WIND_COLOR_STOPS.length - 1][1]);
    expect(windColor(4)).toEqual([66, 123, 164]); // a metà tra 3 e 5 m/s
  });
});
