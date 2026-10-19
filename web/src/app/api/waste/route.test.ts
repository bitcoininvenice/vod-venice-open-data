import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('/api/waste', () => {
  it('returns waste statistics, time series and benchmarks', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.venice2024).toBeDefined();
    expect(body.data.venice2024.separateCollectionRate).toBe(63.8);
    expect(body.data.timeSeries.length).toBe(10);
    expect(body.data.benchmarks.length).toBeGreaterThan(0);
    expect(body.data.metropolitanTotal.separateRate).toBe(74.0);
    expect(body.meta.source).toMatch(/ARPA/);
  });
});
