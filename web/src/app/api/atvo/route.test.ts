import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/atvo', () => {
  it('restituisce i dati delle corse ATVO con metadati ufficiali', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBeGreaterThan(100);
    expect(json.data.trips.length).toBeGreaterThan(100);
    expect(json.data.shapes.length).toBe(4);
    expect(json.meta.source).toContain('ATVO');
  });
});
