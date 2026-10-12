import { describe, expect, it } from 'vitest';
import { measuredMoseClosure, resolveTideState } from './tideCurve';
import type { MoseGateItem } from './types';
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
    expect(res.lagoonTideCm).toBe(70);
    expect(res.moseStatus).toBe('ATTIVATO');
    expect(res.isMoseRaised).toBe(true);
    expect(res.isFlooded).toBe(false);
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

  const gate = (sea: number | null, lagoon: number | null, id: string): MoseGateItem => ({
    id, inletName: id, channel: id, lat: 0, lon: 0, barriersCount: 20, status: 'NON_DISPONIBILE', elevationCm: null,
    tideSeaCm: sea, tideLagoonCm: lagoon,
  });

  it('vicino all ora attuale usa la misura di Punta della Salute senza ridurla una seconda volta', () => {
    // previsione di picco a 125 cm, ma la misura (già dietro le paratie) è 82 cm
    const res = resolveTideState({
      forecast: mockForecast,
      liveTideLevel: 82,
      liveObservedAt: '2026-10-12 10:00:00',
      referenceDate: new Date('2026-10-12T10:05:00+02:00'),
    });
    expect(res.lagoonTideCm).toBe(82);
    expect(res.levelSource).toBe('measured');
    expect(res.moseBasis).toBe('forecast');
    expect(res.moseStatus).toBe('ATTIVATO');
  });

  it('riconosce la chiusura dalle misure alle bocche di porto', () => {
    const closed = [gate(128, 80, 'lido'), gate(126, 84, 'malamocco'), gate(125, 86, 'chioggia')];
    const open = [gate(24, 10, 'lido'), gate(21, 12, 'malamocco'), gate(23, 17, 'chioggia')];
    expect(measuredMoseClosure(closed)).toBe(true);
    expect(measuredMoseClosure(open)).toBe(false);
    expect(measuredMoseClosure([gate(null, 80, 'lido')])).toBeNull();

    const res = resolveTideState({
      liveTideLevel: 84,
      moseGates: closed,
      referenceDate: new Date('2026-10-12T10:00:00+02:00'),
    });
    expect(res.moseStatus).toBe('ATTIVATO');
    expect(res.moseBasis).toBe('measured');
    expect(res.lagoonTideCm).toBe(84);
    expect(res.seaTideCm).toBe(126);
  });

  it('ignora una previsione scaduta e lo segnala', () => {
    const res = resolveTideState({
      forecast: { ...mockForecast, stale: true },
      referenceDate: new Date('2026-10-12T10:00:00+02:00'),
      timelineSeconds: 14 * 3600,
    });
    expect(res.forecastStale).toBe(true);
    expect(res.lagoonTideCm).toBeNull();
    expect(res.levelSource).toBe('none');
    expect(res.moseBasis).toBe('none');
  });

  it('senza previsione né misura non inventa un livello', () => {
    const res = resolveTideState({ referenceDate: new Date('2026-10-12T10:00:00+02:00') });
    expect(res.lagoonTideCm).toBeNull();
    expect(res.isFlooded).toBe(false);
  });

  it('collega la misura attuale al prossimo estremo previsto senza salti', () => {
    const res = resolveTideState({
      forecast: mockForecast,
      liveTideLevel: 30,
      liveObservedAt: '2026-10-12 05:00:00',
      referenceDate: new Date('2026-10-12T05:00:00+02:00'),
      timelineSeconds: 5 * 3600 + 25 * 60,
    });
    expect(res.levelSource).toBe('forecast');
    expect(res.lagoonTideCm).toBeGreaterThan(30);
    expect(res.lagoonTideCm).toBeLessThan(40);
  });
});
