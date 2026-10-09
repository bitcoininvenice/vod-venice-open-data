import { describe, expect, it } from 'vitest';
import { meanDirectionDeg, romeLocalNow } from './flood';

describe('meanDirectionDeg', () => {
  it('fa la media circolare attorno al nord', () => {
    expect(meanDirectionDeg([350, 10])).toBe(0);
    expect(meanDirectionDeg([90, 180])).toBe(135);
  });
  it('restituisce null senza dati o con direzioni opposte', () => {
    expect(meanDirectionDeg([])).toBeNull();
    expect(meanDirectionDeg([0, 180])).toBeNull();
  });
});

describe('romeLocalNow', () => {
  it("usa l'ora locale di Venezia (CEST in estate, CET in inverno)", () => {
    expect(romeLocalNow(new Date('2026-07-01T10:00:00Z'))).toBe('2026-07-01 12:00:00');
    expect(romeLocalNow(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-16 00:30:00');
  });
});
