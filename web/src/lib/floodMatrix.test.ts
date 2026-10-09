import { describe, it, expect } from 'vitest';
import { getFloodedGroundPercentage, getSirenTones } from '@/lib/flood';

describe('Tide Flood Matrix calculations', () => {
  it('reports 0% flood for normal tide levels below 80 cm', () => {
    expect(getFloodedGroundPercentage(50)).toBe(0);
    expect(getFloodedGroundPercentage(70)).toBe(0);
    expect(getFloodedGroundPercentage(79)).toBe(0);
  });

  it('reports small flood percentage for San Marco threshold (80-90 cm)', () => {
    const val80 = getFloodedGroundPercentage(80);
    const val90 = getFloodedGroundPercentage(90);
    expect(val80).toBeGreaterThanOrEqual(0.1);
    expect(val90).toBeLessThanOrEqual(2.0);
  });

  it('reports sustained flood percentage for code orange (110-120 cm)', () => {
    const val110 = getFloodedGroundPercentage(110);
    const val120 = getFloodedGroundPercentage(120);
    expect(val110).toBeGreaterThanOrEqual(10);
    expect(val120).toBeGreaterThan(30);
  });

  it('reports widespread flood for exceptional tide (>= 140 cm)', () => {
    const val140 = getFloodedGroundPercentage(140);
    expect(val140).toBeGreaterThanOrEqual(85);
    expect(val140).toBeLessThanOrEqual(100);
  });

  it('determines the correct city siren warning tone according to Civil Protection regulations', () => {
    expect(getSirenTones(75)).toBe(0); // < 110cm: no alarm
    expect(getSirenTones(105)).toBe(0);
    expect(getSirenTones(110)).toBe(1); // 110cm: 1 continuous tone
    expect(getSirenTones(115)).toBe(1);
    expect(getSirenTones(120)).toBe(2); // 120cm: 2 rising tones
    expect(getSirenTones(125)).toBe(2);
    expect(getSirenTones(130)).toBe(3); // 130cm: 3 rising tones
    expect(getSirenTones(135)).toBe(3);
    expect(getSirenTones(140)).toBe(4); // >= 140cm: 4 rising tones
    expect(getSirenTones(160)).toBe(4);
  });
});
