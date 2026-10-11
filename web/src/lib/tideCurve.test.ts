import { describe, expect, it } from 'vitest';
import { resolveTideState } from './tideCurve';
import type { TideForecast } from './contracts/tide';

describe('tideCurve', () => {
  const mockForecast: TideForecast = {
    issuedAt: '2026-10-12 06:00:00',
    stale: false,
    extremes: [
      { at: '2026-10-12 04:00:00', type: 'min', levelCm: 20 },
      { at: '2026-10-12 10:00:00', type: 'max', levelCm: 125 }, // Picco con MOSE
      { at: '2026-10-12 16:00:00', type: 'min', levelCm: 15 },
      { at: '2026-10-12 22:00:00', type: 'max', levelCm: 75 }, // Picco ordinario
    ],
  };

  it('gestisce il simulatore manuale con protezione MOSE a 140 cm', () => {
    const res = resolveTideState({
      simulatedTideLevel: 140,
      isMoseProtected: true,
    });
    expect(res.seaTideCm).toBe(140);
    expect(res.lagoonTideCm).toBe(85);
    expect(res.moseStatus).toBe('ATTIVATO');
    expect(res.isMoseRaised).toBe(true);
    expect(res.moseLiftProgress).toBe(1.0);
  });

  it('gestisce il simulatore manuale senza protezione MOSE (allagamento completo)', () => {
    const res = resolveTideState({
      simulatedTideLevel: 140,
      isMoseProtected: false,
    });
    expect(res.seaTideCm).toBe(140);
    expect(res.lagoonTideCm).toBe(140);
    expect(res.moseStatus).toBe('ABBASSATO');
    expect(res.isMoseRaised).toBe(false);
    expect(res.isFlooded).toBe(true);
  });

  it('modella la salita della marea ordinaria alle 07:00 (punto medio tra 20 e 125 cm)', () => {
    // 04:00 (20 cm) -> 10:00 (125 cm). Alle 07:00 (metà tempo, alpha = 0.5):
    // cos(pi * 0.5) = 0 -> quota ~ (20 + 125) / 2 = 72-73 cm
    const res = resolveTideState({
      forecast: mockForecast,
      referenceDate: new Date('2026-10-12T07:00:00+02:00'),
    });
    expect(res.seaTideCm).toBeGreaterThanOrEqual(70);
    expect(res.seaTideCm).toBeLessThanOrEqual(75);
    expect(res.moseStatus).toBe('ABBASSATO');
    expect(res.trend).toBe('IN_AUMENTO');
  });

  it('attiva la fase IN_SOLLEVAMENTO del MOSE tra 45 e 15 minuti prima del picco', () => {
    // Picco alle 10:00. Inizio manovra alle 09:15.
    // Alle 09:30 siamo a metà sollevamento (progress ~ 0.5)
    const res = resolveTideState({
      forecast: mockForecast,
      referenceDate: new Date('2026-10-12T09:30:00+02:00'),
    });
    expect(res.moseStatus).toBe('IN_SOLLEVAMENTO');
    expect(res.moseLiftProgress).toBeGreaterThan(0.4);
    expect(res.moseLiftProgress).toBeLessThan(0.6);
    expect(res.isMoseRaised).toBe(true);
  });

  it('mantiene il MOSE ATTIVATO al picco delle 10:00 con protezione lagunare', () => {
    // Picco alle 10:00: mare a 125 cm, laguna calmierata a 85 cm
    const res = resolveTideState({
      forecast: mockForecast,
      referenceDate: new Date('2026-10-12T10:00:00+02:00'),
    });
    expect(res.moseStatus).toBe('ATTIVATO');
    expect(res.moseLiftProgress).toBe(1.0);
    expect(res.seaTideCm).toBe(125);
    expect(res.lagoonTideCm).toBe(85);
    expect(res.isMoseRaised).toBe(true);
  });

  it('abbassa il MOSE dopo il deflusso (fase IN_ABBASSAMENTO)', () => {
    // Chiusura calante: 75 min dopo il picco (11:15) inizia la discesa di 15 min.
    // Alle 11:22 siamo a metà abbassamento
    const res = resolveTideState({
      forecast: mockForecast,
      referenceDate: new Date('2026-10-12T11:22:00+02:00'),
    });
    expect(res.moseStatus).toBe('IN_ABBASSAMENTO');
    expect(res.moseLiftProgress).toBeGreaterThan(0.3);
    expect(res.moseLiftProgress).toBeLessThan(0.7);
  });

  it('lascia il MOSE a riposo per picchi ordinari sotto 110 cm', () => {
    // Alle 22:00 picco a 75 cm
    const res = resolveTideState({
      forecast: mockForecast,
      referenceDate: new Date('2026-10-12T22:00:00+02:00'),
    });
    expect(res.seaTideCm).toBe(75);
    expect(res.lagoonTideCm).toBe(75);
    expect(res.moseStatus).toBe('ABBASSATO');
    expect(res.isMoseRaised).toBe(false);
  });
});
