import { afterEach, describe, expect, it, vi } from 'vitest';
import dailyFuel from '@/data/mimit-fuel-venezia.json';

vi.mock('@/server/sources/mimitFuel', () => ({
  FUEL_REFRESH_S: 21600,
  fuelStations: vi.fn(async () => ({ ok: false, error: 'upstream_connection_econnreset' })),
}));

const DAY = 86_400_000;
const extracted = Date.parse(`${dailyFuel.extractedAt}T00:00:00Z`);

afterEach(() => {
  vi.useRealTimers();
});

describe('/api/carburanti senza risposta del Ministero', () => {
  it('usa i prezzi del file salvato ogni mattina finché è recente', async () => {
    vi.useFakeTimers({ now: extracted + DAY });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body.meta).toMatchObject({ pricesAvailable: true, pricesFrom: 'daily-file', liveError: 'upstream_connection_econnreset', extractedAt: dailyFuel.extractedAt });
    expect(body.data.length).toBe(dailyFuel.stations.length);
    expect(body.data.every((s: { prices: unknown[] }) => s.prices.length > 0)).toBe(true);
    expect(body.summary).not.toBeNull();
  });

  it('con il file troppo vecchio risponde con i distributori di OpenStreetMap, senza prezzi e dichiarandolo', async () => {
    vi.useFakeTimers({ now: extracted + 30 * DAY });
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
