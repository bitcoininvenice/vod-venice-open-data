import { describe, it, expect } from 'vitest';
import { formatTime, getSolarPhase, getDynamicPalette, SUN_HOURS } from './solar';

describe('solar ephemeris and dynamic lighting', () => {
  it('formats seconds into HH:MM string properly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(3600)).toBe('01:00');
    expect(formatTime(12 * 3600 + 34 * 60)).toBe('12:34');
    expect(formatTime(86399)).toBe('23:59');
    expect(formatTime(86400)).toBe('00:00');
    expect(formatTime(-60)).toBe('23:59');
  });

  it('determines solar phases based on Venice solar hours', () => {
    // 03:00 (deep night) -> Notte, next target sunrise 07:18
    const night = getSolarPhase(3 * 3600);
    expect(night.phaseKey).toBe('notte');
    expect(night.icon).toBe('moon');
    expect(night.targetTime).toBe('07:18');

    // 07:00 (between cDawn 06:47 and rise+30m 07:48) -> Alba
    const dawn = getSolarPhase(7 * 3600);
    expect(dawn.phaseKey).toBe('alba');
    expect(dawn.icon).toBe('sunrise');
    expect(dawn.targetTime).toBe('07:18');

    // 12:00 (midday) -> Giorno, next target sunset 18:38
    const day = getSolarPhase(12 * 3600);
    expect(day.phaseKey).toBe('giorno');
    expect(day.icon).toBe('sun');
    expect(day.targetTime).toBe('18:38');

    // 18:00 (golden hour before sunset at 18:38) -> Golden Hour
    const goldenHour = getSolarPhase(18 * 3600);
    expect(goldenHour.phaseKey).toBe('goldenHour');
    expect(goldenHour.icon).toBe('sunset');
    expect(goldenHour.targetTime).toBe('18:38');

    // 19:00 (civil dusk before nautical dusk at 19:42) -> Crepuscolo
    const dusk = getSolarPhase(19 * 3600);
    expect(dusk.phaseKey).toBe('crepuscolo');
    expect(dusk.icon).toBe('sunset');
    expect(dusk.targetTime).toBe('19:42');

    // 22:00 (late night) -> Notte
    const lateNight = getSolarPhase(22 * 3600);
    expect(lateNight.phaseKey).toBe('notte');
    expect(lateNight.icon).toBe('moon');
    expect(lateNight.targetTime).toBe('07:18');
  });

  it('computes dynamic palette without throwing', () => {
    const nightPalette = getDynamicPalette(2 * 3600);
    expect(nightPalette.ground).toBeDefined();
    expect(nightPalette.water).toBeDefined();

    const middayPalette = getDynamicPalette(12 * 3600);
    expect(middayPalette.ground).toBeDefined();
    expect(middayPalette.water).toBeDefined();

    const sunsetPalette = getDynamicPalette(SUN_HOURS.set);
    expect(sunsetPalette.ground).toBeDefined();
  });
});
