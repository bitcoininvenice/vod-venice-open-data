import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeParts, getSolarPhase, getDynamicPalette, sunHoursFor, NOTTE } from './solar';

const OCT_8 = new Date('2026-10-08T12:00:00Z');

describe('solar ephemeris and dynamic lighting', () => {
  it('formats seconds into HH:MM string properly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(3600)).toBe('01:00');
    expect(formatTime(12 * 3600 + 34 * 60)).toBe('12:34');
    expect(formatTime(86399)).toBe('23:59');
    expect(formatTime(86400)).toBe('00:00');
    expect(formatTime(-60)).toBe('23:59');
  });

  it('formats seconds into separate hoursMinutes and seconds properly', () => {
    expect(formatTimeParts(0)).toEqual({ hoursMinutes: '00:00', seconds: '00' });
    expect(formatTimeParts(45)).toEqual({ hoursMinutes: '00:00', seconds: '45' });
    expect(formatTimeParts(3600 + 125)).toEqual({ hoursMinutes: '01:02', seconds: '05' });
    expect(formatTimeParts(12 * 3600 + 34 * 60 + 59)).toEqual({ hoursMinutes: '12:34', seconds: '59' });
    expect(formatTimeParts(86399)).toEqual({ hoursMinutes: '23:59', seconds: '59' });
  });

  it('determines solar phases based on Venice solar hours (8 ottobre)', () => {
    // 03:00 (deep night) -> Notte, next target sunrise 07:15
    const night = getSolarPhase(3 * 3600, OCT_8);
    expect(night.phaseKey).toBe('notte');
    expect(night.icon).toBe('moon');
    expect(night.targetTime).toBe('07:15');

    // 07:00 (between cDawn 06:46 and rise+30m 07:45) -> Alba
    const dawn = getSolarPhase(7 * 3600, OCT_8);
    expect(dawn.phaseKey).toBe('alba');
    expect(dawn.icon).toBe('sunrise');
    expect(dawn.targetTime).toBe('07:15');

    // 12:00 (midday) -> Giorno, next target sunset 18:40
    const day = getSolarPhase(12 * 3600, OCT_8);
    expect(day.phaseKey).toBe('giorno');
    expect(day.icon).toBe('sun');
    expect(day.targetTime).toBe('18:40');

    // 18:00 (golden hour before sunset at 18:40) -> Golden Hour
    const goldenHour = getSolarPhase(18 * 3600, OCT_8);
    expect(goldenHour.phaseKey).toBe('goldenHour');
    expect(goldenHour.icon).toBe('sunset');
    expect(goldenHour.targetTime).toBe('18:40');

    // 19:00 (civil dusk before nautical dusk at 19:43) -> Crepuscolo
    const dusk = getSolarPhase(19 * 3600, OCT_8);
    expect(dusk.phaseKey).toBe('crepuscolo');
    expect(dusk.icon).toBe('sunset');
    expect(dusk.targetTime).toBe('19:43');

    // 22:00 (late night) -> Notte
    const lateNight = getSolarPhase(22 * 3600, OCT_8);
    expect(lateNight.phaseKey).toBe('notte');
    expect(lateNight.icon).toBe('moon');
    expect(lateNight.targetTime).toBe('07:15');
  });

  it('computes dynamic palette without throwing', () => {
    const nightPalette = getDynamicPalette(2 * 3600);
    expect(nightPalette.ground).toBeDefined();
    expect(nightPalette.water).toBeDefined();

    const middayPalette = getDynamicPalette(12 * 3600);
    expect(middayPalette.ground).toBeDefined();
    expect(middayPalette.water).toBeDefined();

    const sunsetPalette = getDynamicPalette(sunHoursFor(OCT_8).set, OCT_8);
    expect(sunsetPalette.ground).toBeDefined();
  });

  it('adatta alba e tramonto alla stagione (ora di Venezia, CET/CEST)', () => {
    const summer = sunHoursFor(new Date('2026-06-21T12:00:00Z'));
    const winter = sunHoursFor(new Date('2026-12-21T12:00:00Z'));
    expect(formatTime(summer.rise)).toBe('05:21');
    expect(formatTime(summer.set)).toBe('21:02');
    expect(formatTime(winter.rise)).toBe('07:47');
    expect(formatTime(winter.set)).toBe('16:29');
    // alle 20:30 di giugno è ancora giorno, a dicembre è notte piena
    expect(getSolarPhase(20.5 * 3600, new Date('2026-06-21T12:00:00Z')).phaseKey).toBe('goldenHour');
    expect(getDynamicPalette(20.5 * 3600, new Date('2026-12-21T12:00:00Z'))).toBe(NOTTE);
  });
});
