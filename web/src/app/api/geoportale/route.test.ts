import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/geoportale', () => {
  it('restituisce i metadati completi del SIT Comune di Venezia in nominale', async () => {
    const req = new Request('https://veniceopendata.com/api/geoportale');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta.kind).toBe('official-sit');
    expect(body.meta.nature).toBe('measured');
    expect(body.meta.source).toContain('Comune di Venezia');
    expect(body.meta.license).toContain('IODL 2.0');

    expect(body.data.municipalities).toHaveLength(6);
    expect(body.data.sestieri.length).toBeGreaterThanOrEqual(6);
    expect(body.data.tutelaZones.length).toBeGreaterThanOrEqual(4);
    expect(body.data.services).toHaveLength(28);
    expect(body.data.stats.totalServices).toBe(28);
  });

  it('supporta il filtro per tema urbanistica_piani', async () => {
    const req = new Request('https://veniceopendata.com/api/geoportale?theme=urbanistica_piani');
    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.services.length).toBeGreaterThan(0);
    expect(body.data.services.every((s: { theme: string }) => s.theme === 'urbanistica_piani')).toBe(true);
  });

  it('supporta la ricerca per parola chiave nel catalogo', async () => {
    const req = new Request('https://veniceopendata.com/api/geoportale?q=scuole');
    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.services.length).toBeGreaterThan(0);
    expect(body.data.services.some((s: { name: string }) => s.name.toLowerCase().includes('scuole'))).toBe(true);
  });

  it('supporta la richiesta selettiva section=municipalities', async () => {
    const req = new Request('https://veniceopendata.com/api/geoportale?section=municipalities');
    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(6);
    expect(body.data[0]).toHaveProperty('rings');
    expect(body.data[0]).toHaveProperty('centroid');
  });

  it('supporta la richiesta selettiva section=tutela', async () => {
    const req = new Request('https://veniceopendata.com/api/geoportale?section=tutela');
    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(4);
    expect(body.data[0]).toHaveProperty('normative');
  });
});
