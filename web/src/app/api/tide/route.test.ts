import { afterEach, describe, expect, it, vi } from 'vitest';
import livello from '@/test/fixtures/livello.json';
import previsione from '@/test/fixtures/previsione.json';
import type { TideResponse } from '@/lib/contracts/tide';
import { GET } from './route';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('GET /api/tide', () => {
  it('restituisce livelli reali, previsione con data di emissione e MOSE senza stato inventato', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('livello') ? json(livello) : json(previsione))));
    const res = await GET();
    const body = (await res.json()) as TideResponse;

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.reference?.levelCm).toBe(12);
    expect(body.data.category).toBe('NORMALE');
    expect(body.data.forecast?.issuedAt).toBe('2026-09-21 17:00:00');
    expect(body.meta.forecast.observedAt).toBe('2026-09-21 17:00:00');
    expect(body.data.moseGates).toHaveLength(4);
    expect(body.data.moseGates.every((g) => g.status === 'NON_DISPONIBILE')).toBe(true);
    expect(body.data.moseGates.reduce((acc, g) => acc + g.barriersCount, 0)).toBe(78);
    // livelli lato mare/laguna presi dalle stazioni reali
    expect(body.data.moseGates[0].tideLagoonCm).toBe(12);
  });

  it('se la copia in cache non ha misure riprova senza cache', async () => {
    const empty = livello.map((s) => ({ ID_stazione: s.ID_stazione, stazione: s.stazione, latDDN: s.latDDN, lonDDE: s.lonDDE }));
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('previsione')) return json(previsione);
      return json(u.includes('?t=') ? livello : empty);
    });
    vi.stubGlobal('fetch', fetchMock);
    const body = (await (await GET()).json()) as TideResponse;
    expect(body.ok).toBe(true);
    expect(body.data.reference?.levelCm).toBe(12);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('?t='))).toBe(true);
  });

  it('se la fonte non risponde restituisce 503 senza valori inventati', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNRESET'); }));
    const res = await GET();
    const body = (await res.json()) as TideResponse;

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.data.reference).toBeNull();
    expect(body.data.stations).toEqual([]);
    expect(body.data.forecast).toBeNull();
    expect(body.data.moseGates.every((g) => g.tideSeaCm === null && g.tideLagoonCm === null)).toBe(true);
  });
});
