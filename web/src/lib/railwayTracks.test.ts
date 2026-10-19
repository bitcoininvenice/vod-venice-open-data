import { describe, it, expect } from 'vitest';
import {
  snapTrainToRailway,
  isInboundToSantaLucia,
  VENICE_RAILWAY_MAINLINE,
} from './railwayTracks';

describe('railwayTracks', () => {
  it('detects inbound destinations to Santa Lucia', () => {
    expect(isInboundToSantaLucia('Venezia Santa Lucia')).toBe(true);
    expect(isInboundToSantaLucia('Venezia S. Lucia')).toBe(true);
    expect(isInboundToSantaLucia('Venezia')).toBe(true);
    expect(isInboundToSantaLucia('Milano Centrale')).toBe(false);
    expect(isInboundToSantaLucia('Roma Termini')).toBe(false);
    expect(isInboundToSantaLucia(undefined)).toBe(false);
  });

  it('snaps a point on Ponte della Liberta to the railway track', () => {
    // Coordinate leggermente scostate a sud nel viadotto
    const rawLon = 12.2795;
    const rawLat = 45.4635; // ~130 metri a sud della mezzeria ferroviaria (45.4647)

    const result = snapTrainToRailway(rawLon, rawLat, {
      destination: 'Venezia Santa Lucia',
    });

    expect(result.snapped).toBe(true);
    expect(result.distanceMeters).toBeLessThan(200);
    expect(result.lat).toBeCloseTo(45.4647, 2);
    // Viaggiando verso Santa Lucia (inbound), l'orientamento deve essere verso est-sud-est (~128 deg)
    expect(result.bearing).toBeGreaterThan(110);
    expect(result.bearing).toBeLessThan(150);
  });

  it('orients outbound trains towards terraferma (~308 deg)', () => {
    const rawLon = 12.2740;
    const rawLat = 45.4674;

    const result = snapTrainToRailway(rawLon, rawLat, {
      destination: 'Milano Centrale',
    });

    expect(result.snapped).toBe(true);
    expect(result.bearing).toBeGreaterThan(280);
    expect(result.bearing).toBeLessThan(330);
  });

  it('respects rawBearing if provided and closest to travel direction', () => {
    const rawLon = 12.2795;
    const rawLat = 45.4647;

    const resultInbound = snapTrainToRailway(rawLon, rawLat, {
      rawBearing: 125,
    });
    expect(resultInbound.bearing).toBeCloseTo(128, -1);

    const resultOutbound = snapTrainToRailway(rawLon, rawLat, {
      rawBearing: 305,
    });
    expect(resultOutbound.bearing).toBeCloseTo(308, -1);
  });

  it('does not snap points far away from Venice railway corridor', () => {
    // Piazza San Marco (lontano dalla ferrovia)
    const result = snapTrainToRailway(12.338, 45.434);
    expect(result.snapped).toBe(false);
    expect(result.lon).toBe(12.338);
    expect(result.lat).toBe(45.434);
  });

  it('has mainline points from Santa Lucia to Mestre', () => {
    expect(VENICE_RAILWAY_MAINLINE.length).toBeGreaterThan(5);
    const sl = VENICE_RAILWAY_MAINLINE[0];
    expect(sl.lon).toBe(12.3210);
    expect(sl.lat).toBe(45.4412);
  });
});
