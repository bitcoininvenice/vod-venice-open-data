import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/seveso', () => {
  it('returns all Seveso establishments and summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/seveso');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(16);
    expect(body.data.summary.total).toBe(16);
    expect(body.data.summary.upperThreshold).toBeGreaterThan(0);
    expect(body.data.establishments.length).toBe(16);
    expect(body.meta.source).toMatch(/ARPA/);
  });

  it('filters by municipality', async () => {
    const req = new NextRequest('http://localhost:3000/api/seveso?municipality=Venezia');
    const res = await GET(req);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);
    expect(body.data.establishments.every((e: { municipality: string }) => e.municipality === 'Venezia')).toBe(true);
  });

  it('filters by threshold', async () => {
    const req = new NextRequest('http://localhost:3000/api/seveso?threshold=SS');
    const res = await GET(req);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.establishments.every((e: { threshold: string }) => e.threshold === 'SS')).toBe(true);
  });
});
