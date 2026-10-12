import { describe, it, expect } from 'vitest';
import {
  LAGOON_CURRENT_CHANNELS,
  computeLagoonCurrentState,
  evaluateArpavWaterQuality,
} from './lagoonCurrents';

describe('lagoonCurrents module', () => {
  it('defines valid channels across inlets and urban routes', () => {
    expect(LAGOON_CURRENT_CHANNELS.length).toBeGreaterThanOrEqual(10);
    const lido = LAGOON_CURRENT_CHANNELS.find((c) => c.id === 'bocca-lido');
    expect(lido).toBeDefined();
    expect(lido?.maxSpeedKnots).toBeGreaterThan(2.0);
    expect(lido?.coordinates.length).toBeGreaterThanOrEqual(2);
    for (const c of LAGOON_CURRENT_CHANNELS) {
      expect(c.lon).toBeGreaterThan(12.1);
      expect(c.lon).toBeLessThan(12.6);
      expect(c.lat).toBeGreaterThan(45.15);
      expect(c.lat).toBeLessThan(45.6);
    }

    const canalGrande = LAGOON_CURRENT_CHANNELS.find((c) => c.id === 'canal-grande');
    expect(canalGrande).toBeDefined();
    expect(canalGrande?.zone).toBe('CENTRO_STORICO');
  });

  it('computes slack water when near tide extremes', () => {
    const fakeExtremes = [
      { at: '2026-10-12 14:25:00', levelCm: 95 },
      { at: '2026-10-12 20:40:00', levelCm: 10 },
    ];
    // Now is 14:20 (5 minutes before extreme) -> STANCA
    const nowMs = new Date(2026, 9, 12, 14, 20).getTime();
    const state = computeLagoonCurrentState(90, fakeExtremes, nowMs);

    expect(state.phase).toBe('STANCA');
    expect(state.flowDirection).toBe('SLACK');
    expect(state.speedFactor).toBeLessThan(0.2);
    expect(state.nextSlackMinutes).toBe(5);
  });

  it('computes ebb tide (riflusso) when tide is falling towards low tide', () => {
    const fakeExtremes = [
      { at: '2026-10-12 12:00:00', levelCm: 95 },
      { at: '2026-10-12 18:00:00', levelCm: 10 },
    ];
    // Now is 15:00 (midway from high to low) -> RIFLUSSO
    const nowMs = new Date(2026, 9, 12, 15, 0).getTime();
    const state = computeLagoonCurrentState(50, fakeExtremes, nowMs);

    expect(state.phase).toBe('RIFLUSSO');
    expect(state.flowDirection).toBe('OUTBOUND');
    expect(state.speedFactor).toBeGreaterThan(0.8);
    expect(state.nextSlackMinutes).toBe(180);
  });

  it('computes flood tide (flusso) when tide is rising towards high tide', () => {
    const fakeExtremes = [
      { at: '2026-10-12 06:00:00', levelCm: 10 },
      { at: '2026-10-12 12:00:00', levelCm: 95 },
    ];
    // Now is 09:00 -> FLUSSO
    const nowMs = new Date(2026, 9, 12, 9, 0).getTime();
    const state = computeLagoonCurrentState(50, fakeExtremes, nowMs);

    expect(state.phase).toBe('FLUSSO');
    expect(state.flowDirection).toBe('INBOUND');
    expect(state.speedFactor).toBeGreaterThan(0.8);
  });

  it('evaluates ARPAV ecological quality correctly', () => {
    // High quality: low chlorophyll, balanced oxygen
    const high = evaluateArpavWaterQuality(1.2, 100, 34);
    expect(high.status).toBe('ELEVATO');

    // Good quality: moderate chlorophyll
    const good = evaluateArpavWaterQuality(3.5, 95, 33);
    expect(good.status).toBe('BUONO');

    // Hypoxia / Critical: low oxygen
    const hypoxia = evaluateArpavWaterQuality(22, 45, 28);
    expect(hypoxia.status).toBe('SCARSO');
  });
});
