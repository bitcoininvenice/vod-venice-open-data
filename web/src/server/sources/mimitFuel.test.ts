import { afterEach, describe, expect, it, vi } from 'vitest';
import { fuelStations, parseFuel, resetFuelCache } from './mimitFuel';

// Estratto nel formato del Ministero (separatore «|» dal 10/02/2026)
const STATIONS = `Estrazione del 2026-10-15
idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine
1|MARIO ROSSI|Api-Ip|Stradale|IMPIANTO DI MARIO ROSSI|SERENELLA 16 30141|VENEZIA|VE|45.457724|12.345324
2|SOCIETA SRL|Agip Eni|Autostradale|AREA SERVIZIO|A4 KM 380|MIRA|VE|45.43|12.14
3|ALTRO|Shell|Stradale|ROMA|VIA ROMA 1|ROMA|RM|41.9|12.49
4|SENZA PREZZI|Q8|Stradale|X|VIA X|VENEZIA|VE|45.48|12.24`;

const PRICES = `Estrazione del 2026-10-15
idImpianto|descCarburante|prezzo|isSelf|dtComu
1|Benzina|1.789|1|15/10/2026 07:30:00
1|Benzina|1.949|0|15/10/2026 07:30:00
2|Gasolio|1.899|1|14/10/2026 20:00:07
3|Benzina|1.700|1|15/10/2026 07:00:00`;

describe('prezzi dei carburanti MIMIT', () => {
  afterEach(() => resetFuelCache());

  it('tiene solo l’area della mappa e mai il nome del gestore o dell’impianto', () => {
    const d = parseFuel(STATIONS, PRICES, 1);
    expect(d.extractedAt).toBe('2026-10-15');
    expect(d.stations.map((s) => s.id)).toEqual(['1', '2']);
    const s = d.stations[0];
    expect(s).toMatchObject({ brand: 'Api-Ip', address: 'SERENELLA 16', comune: 'VENEZIA', highway: false });
    expect(JSON.stringify(d)).not.toMatch(/ROSSI|SOCIETA/);
    expect(s.prices[0]).toEqual({ fuel: 'Benzina', self: true, price: 1.789, communicatedAt: '2026-10-15T05:30:00.000Z' });
    expect(d.stations[1].highway).toBe(true);
  });

  it('legge anche il vecchio separatore «;»', () => {
    const d = parseFuel(STATIONS.replaceAll('|', ';'), PRICES.replaceAll('|', ';'), 1);
    expect(d.stations).toHaveLength(2);
  });

  it('rifiuta un’anagrafica incompleta', () => {
    expect(() => parseFuel(STATIONS, PRICES)).toThrow(/incompleta/);
  });

  it('legge i due file una volta sola e tiene l’ultima lettura valida se il Ministero non risponde', async () => {
    const big = STATIONS + '\n' + Array.from({ length: 15_000 }, (_, i) => `${100 + i}|G|B|Stradale|N|V|ROMA|RM|41.9|12.49`).join('\n');
    const ok = vi.fn(async (url: string) => new Response(String(url).includes('anagrafica') ? big : PRICES));
    const now = Date.parse('2026-10-16T08:00:00Z');
    const [a, b] = await Promise.all([fuelStations(ok as unknown as typeof fetch, now), fuelStations(ok as unknown as typeof fetch, now)]);
    expect(ok).toHaveBeenCalledTimes(2);
    expect(a.ok && b.ok && a.data.stations.length).toBe(2);
    const down = vi.fn(async () => new Response('', { status: 503 }));
    const later = await fuelStations(down as unknown as typeof fetch, now + 7 * 3600_000);
    expect(down).toHaveBeenCalled();
    expect(later.ok).toBe(true);
  });
});
