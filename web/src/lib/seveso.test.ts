import { describe, expect, it } from 'vitest';
import {
  SEVESO_DATA,
  SEVESO_ESTABLISHMENTS,
  getSevesoEstablishments,
  getSevesoSummaryStats,
} from './seveso';

describe('seveso lib', () => {
  it('loads Seveso dataset with valid metadata', () => {
    expect(SEVESO_DATA.metadata).toBeDefined();
    expect(SEVESO_DATA.metadata.totalCount).toBeGreaterThan(0);
    expect(SEVESO_DATA.metadata.source).toContain('ARPA Veneto');
  });

  it('contains expected establishments list', () => {
    expect(SEVESO_ESTABLISHMENTS.length).toBe(16);
    const sample = SEVESO_ESTABLISHMENTS[0];
    expect(sample.id).toBeDefined();
    expect(sample.name).toBeDefined();
    expect(sample.lat).toBeGreaterThan(45.0);
    expect(sample.lon).toBeGreaterThan(12.0);
    expect(['SS', 'SI']).toContain(sample.threshold);
  });

  it('filters establishments by municipality', () => {
    const venice = getSevesoEstablishments({ municipality: 'Venezia' });
    expect(venice.length).toBeGreaterThan(0);
    expect(venice.every((e) => e.municipality === 'Venezia')).toBe(true);
  });

  it('filters establishments by threshold', () => {
    const upper = getSevesoEstablishments({ threshold: 'SS' });
    const lower = getSevesoEstablishments({ threshold: 'SI' });
    expect(upper.length + lower.length).toBe(SEVESO_ESTABLISHMENTS.length);
    expect(upper.every((e) => e.threshold === 'SS')).toBe(true);
    expect(lower.every((e) => e.threshold === 'SI')).toBe(true);
  });

  it('filters establishments by lagoon basin', () => {
    const lagoonOnly = getSevesoEstablishments({ lagoonOnly: true });
    expect(lagoonOnly.length).toBeGreaterThan(0);
    expect(lagoonOnly.every((e) => e.inLagoonBasin)).toBe(true);
  });

  it('computes summary statistics accurately', () => {
    const stats = getSevesoSummaryStats();
    expect(stats.total).toBe(16);
    expect(stats.upperThreshold + stats.lowerThreshold).toBe(16);
    expect(stats.veniceTotal).toBeGreaterThan(0);
    expect(stats.portMargheraTotal).toBeGreaterThan(0);
    expect(stats.lagoonBasinCount).toBeGreaterThan(0);
  });
});
