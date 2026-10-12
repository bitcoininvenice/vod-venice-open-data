import { describe, it, expect } from 'vitest';
import {
  LAGOON_CURRENT_CHANNELS,
  channelDescKey,
  computeLagoonCurrentState,
  evaluateArpavWaterQuality,
} from './lagoonCurrents';
import { itUi } from './i18n/ui.it';
import { enUi } from './i18n/ui.en';
import type { TideForecast } from './contracts/tide';

const forecast = (extremes: [string, 'max' | 'min', number][], stale = false): TideForecast => ({
  issuedAt: '2026-10-12 06:00:00',
  stale,
  extremes: extremes.map(([at, type, levelCm]) => ({ at, type, levelCm })),
});
/** Istante in ora di Roma (ottobre: UTC+2), indipendente dal fuso della macchina */
const rome = (hhmm: string) => new Date(`2026-10-12T${hhmm}:00+02:00`).getTime();

describe('correnti lagunari (stima)', () => {
  it('canali con coordinate in laguna e descrizione tradotta', () => {
    expect(LAGOON_CURRENT_CHANNELS.length).toBeGreaterThanOrEqual(10);
    for (const c of LAGOON_CURRENT_CHANNELS) {
      expect(c.lon).toBeGreaterThan(12.1);
      expect(c.lon).toBeLessThan(12.6);
      expect(c.lat).toBeGreaterThan(45.15);
      expect(c.lat).toBeLessThan(45.6);
      const key = channelDescKey(c.id).replace('ui.lagoonHydro.', '') as keyof typeof itUi.lagoonHydro;
      expect(itUi.lagoonHydro[key], c.id).toBeTruthy();
      expect(enUi.lagoonHydro[key], c.id).toBeTruthy();
    }
  });

  it('stanca vicino a un colmo, con l ora di Roma', () => {
    const f = forecast([['2026-10-12 08:00:00', 'min', 10], ['2026-10-12 14:25:00', 'max', 95], ['2026-10-12 20:40:00', 'min', 10]]);
    const state = computeLagoonCurrentState(f, rome('14:20'));
    expect(state?.phase).toBe('STANCA');
    expect(state?.flowDirection).toBe('SLACK');
    expect(state?.nextSlackMinutes).toBe(5);
    expect(state?.nextSlack).toEqual({ time: '14:25', levelCm: 95 });
  });

  it('riflusso quando la marea scende verso il cavo', () => {
    const f = forecast([['2026-10-12 12:00:00', 'max', 95], ['2026-10-12 18:00:00', 'min', 10]]);
    const state = computeLagoonCurrentState(f, rome('15:00'));
    expect(state?.phase).toBe('RIFLUSSO');
    expect(state?.flowDirection).toBe('OUTBOUND');
    expect(state?.speedFactor).toBeGreaterThan(0.8);
    expect(state?.nextSlackMinutes).toBe(180);
  });

  it('flusso quando la marea sale verso il colmo', () => {
    const f = forecast([['2026-10-12 06:00:00', 'min', 10], ['2026-10-12 12:00:00', 'max', 95]]);
    const state = computeLagoonCurrentState(f, rome('09:00'));
    expect(state?.phase).toBe('FLUSSO');
    expect(state?.flowDirection).toBe('INBOUND');
  });

  it('senza previsione valida non inventa una fase', () => {
    const f = forecast([['2026-10-12 06:00:00', 'min', 10], ['2026-10-12 12:00:00', 'max', 95]]);
    expect(computeLagoonCurrentState(null, rome('09:00'))).toBeNull();
    expect(computeLagoonCurrentState({ ...f, stale: true }, rome('09:00'))).toBeNull();
    // fuori dall'intervallo coperto dalla previsione
    expect(computeLagoonCurrentState(f, rome('13:00'))).toBeNull();
  });
});

describe('classe trofica indicativa ARPAV', () => {
  it('classifica da clorofilla e ossigeno', () => {
    expect(evaluateArpavWaterQuality(1.2, 100)?.status).toBe('ELEVATO');
    expect(evaluateArpavWaterQuality(3.5, 95)?.status).toBe('BUONO');
    expect(evaluateArpavWaterQuality(22, 45)?.status).toBe('SCARSO');
  });

  it('senza misure non assegna una classe', () => {
    expect(evaluateArpavWaterQuality(null, null)).toBeNull();
    // con una sola misura la classe ottima non è assegnabile
    expect(evaluateArpavWaterQuality(1.0, null)?.status).toBe('BUONO');
  });
});
