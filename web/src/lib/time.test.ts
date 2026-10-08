import { describe, expect, it } from 'vitest';
import { formatLocalStamp, formatSignedCm, romeDayType, romeSecondsOfDay } from './time';

describe('ora di Venezia', () => {
  it('calcola i secondi dalla mezzanotte in Europe/Rome indipendentemente dal fuso del sistema', () => {
    // 22:30 UTC del 7 ottobre = 00:30 CEST dell'8 ottobre
    expect(Math.floor(romeSecondsOfDay(new Date('2026-10-07T22:30:00Z')))).toBe(30 * 60);
  });
  it('determina il giorno di servizio a Venezia', () => {
    // sabato 10 ottobre 23:30 UTC = domenica 11 ottobre 01:30 a Venezia
    expect(romeDayType(new Date('2026-10-10T23:30:00Z'))).toBe('sunday');
    expect(romeDayType(new Date('2026-10-08T10:00:00Z'))).toBe('weekday');
  });
});

describe('formattazione', () => {
  it('livelli con segno', () => {
    expect(formatSignedCm(17)).toBe('+17 cm');
    expect(formatSignedCm(-5)).toBe('-5 cm');
    expect(formatSignedCm(0)).toBe('0 cm');
    expect(formatSignedCm(null)).toBe('n.d.');
  });
  it('timestamp locali della fonte', () => {
    expect(formatLocalStamp('2026-10-08 01:40:00')).toBe('08/10/2026 01:40');
    expect(formatLocalStamp(null)).toBe('n.d.');
  });
});
