import { describe, expect, it, vi } from 'vitest';
import trainsJson from '@/data/trains-venezia.json';

// senza il GTFS ACTV (pesante): si contano gli altri orari
vi.mock('@/server/sources/simulationServer', () => ({ serverSimulation: vi.fn(async () => null) }));

describe('/api/emissions', () => {
  it('conta le corse di oggi per alimentazione dagli orari, senza stime di CO2', async () => {
    const start = trainsJson.startDate;
    vi.useFakeTimers({ now: new Date(`${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}T12:00:00+02:00`).getTime() + 2 * 86_400_000 });
    const { GET } = await import('./route');
    const body = await (await GET()).json();
    vi.useRealTimers();
    expect(body.success).toBe(true);
    const { modes, totals, total } = body.data;
    expect(modes.find((m: { mode: string }) => m.mode === 'train')).toMatchObject({ propulsion: 'electric' });
    expect(totals.electric).toBeGreaterThan(0);
    expect(total).toBe(totals.electric + totals.fossil + totals.unknown);
    expect(JSON.stringify(body)).not.toMatch(/co2Kg|Co2Tons|totalGrams/);
    expect(body.meta.note).toMatch(/Nessuna stima di CO2/);
  });
});
