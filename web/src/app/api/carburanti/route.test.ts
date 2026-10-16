import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/sources/mimitFuel', () => ({
  FUEL_REFRESH_S: 21600,
  fuelStations: vi.fn(async () => ({ ok: false, error: 'upstream_connection_econnreset' })),
}));

describe('/api/carburanti senza i prezzi del Ministero', () => {
  it('risponde con i distributori di OpenStreetMap, senza prezzi e dichiarandolo', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=900');
    const body = await res.json();
    expect(body.meta).toMatchObject({ pricesAvailable: false, license: expect.stringMatching(/ODbL/), pricesError: 'upstream_connection_econnreset' });
    expect(body.summary).toBeNull();
    expect(body.data.length).toBeGreaterThan(60);
    expect(body.data.every((s: { prices: unknown[]; osm?: unknown }) => s.prices.length === 0 && s.osm)).toBe(true);
  });
});
