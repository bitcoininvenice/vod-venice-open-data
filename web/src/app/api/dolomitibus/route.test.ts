import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/dolomitibus', () => {
  it('restituisce i dati delle corse Dolomiti Bus con metadati ufficiali', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      success: boolean;
      count: number;
      data: { trips: Array<{ line: string; stops: unknown[] }>; shapes: unknown[] };
      meta: { source: string; attribution: string; license: string };
    };

    expect(json.success).toBe(true);
    expect(json.count).toBeGreaterThan(0);
    expect(json.data.trips.length).toBe(json.count);
    expect(json.data.shapes.length).toBe(2);
    expect(json.meta.source).toContain('Dolomiti Bus');
    expect(json.data.trips[0].line).toBe('72');
  });
});
