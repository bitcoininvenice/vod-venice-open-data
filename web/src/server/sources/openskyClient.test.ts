import { afterEach, describe, expect, it, vi } from 'vitest';
import { openSkyFlights, OPENSKY_REFRESH_S, resetOpenSkyClient, retryAfterSeconds } from './openskyClient';

const states = (n: number) => ({
  time: 1,
  states: Array.from({ length: n }, (_, i) => [`abc${i}`, `TEST${i}`, 'Italy', 0, 0, 12.3, 45.5, 1000, false, 100, 90, 0]),
});
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

afterEach(() => resetOpenSkyClient());

describe('client OpenSky condiviso', () => {
  it('una sola richiesta ogni 30 s, anche con richieste contemporanee', async () => {
    const fetchMock = vi.fn(async () => ok(states(2))) as unknown as typeof fetch;
    const t0 = 1_000_000;
    const [a, b] = await Promise.all([openSkyFlights(fetchMock, t0), openSkyFlights(fetchMock, t0)]);
    expect(a.flights).toHaveLength(2);
    expect(b.flights).toHaveLength(2);
    await openSkyFlights(fetchMock, t0 + (OPENSKY_REFRESH_S - 1) * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await openSkyFlights(fetchMock, t0 + (OPENSKY_REFRESH_S + 1) * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('quota esaurita (429): ultimo dato valido dichiarato vecchio e nessun nuovo tentativo fino all\'ora indicata', async () => {
    const t0 = 2_000_000;
    await openSkyFlights(vi.fn(async () => ok(states(3))) as unknown as typeof fetch, t0);
    const limited = vi.fn(async () => new Response('Too many requests', { status: 429, headers: { 'X-Rate-Limit-Retry-After-Seconds': '3600' } })) as unknown as typeof fetch;
    const r = await openSkyFlights(limited, t0 + 60_000);
    expect(r).toMatchObject({ ok: true, stale: true });
    expect(r.flights).toHaveLength(3);
    expect(r.quotaUntil).toBe(new Date(t0 + 60_000 + 3600_000).toISOString());
    // durante l'attesa OpenSky non si interroga più
    await openSkyFlights(limited, t0 + 120_000);
    await openSkyFlights(limited, t0 + 1800_000);
    expect(limited).toHaveBeenCalledTimes(1);
    // dopo 10 minuti il dato vecchio non si mostra più
    const old = await openSkyFlights(limited, t0 + 1800_000);
    expect(old).toMatchObject({ ok: false, stale: false, flights: [] });
  });

  it('attesa dopo 429 dalle intestazioni, altrimenti 15 minuti', () => {
    expect(retryAfterSeconds(new Headers({ 'X-Rate-Limit-Retry-After-Seconds': '120' }))).toBe(120);
    expect(retryAfterSeconds(new Headers({ 'Retry-After': '30' }))).toBe(30);
    expect(retryAfterSeconds(new Headers())).toBe(900);
  });

  it('fonte non raggiungibile senza dati precedenti: nessun volo, nessuna quota', async () => {
    const r = await openSkyFlights(vi.fn(async () => { throw new Error('rete'); }) as unknown as typeof fetch, 3_000_000);
    expect(r).toMatchObject({ ok: false, flights: [], quotaUntil: null, error: 'upstream_unavailable' });
  });
});
