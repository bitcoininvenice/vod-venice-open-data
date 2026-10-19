import { describe, expect, it, beforeEach } from 'vitest';
import {
  extractDateFromCsv,
  parseCommunicatedAt,
  parseCsvRows,
  parseClientPricesCsv,
  parseClientFullDataset,
  saveClientFuelCache,
  loadClientFuelCache,
  clearClientFuelCache,
} from './fuelClient';
import type { FuelStation } from './fuel';

describe('fuelClient - client-side MIMIT price parsing and storage', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  } as unknown as Storage;

  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { localStorage: Storage }).localStorage = mockStorage;
  });

  it('estrae la data di estrazione dall intestazione del CSV', () => {
    const csv = 'Estrazione del 2026-10-17 08:00:00\nidImpianto|descCarburante|prezzo\n';
    expect(extractDateFromCsv(csv)).toBe('2026-10-17');
    expect(extractDateFromCsv('idImpianto;prezzo')).toBeNull();
  });

  it('converte date di comunicazione formato italiano in ISO UTC', () => {
    const iso = parseCommunicatedAt('17/10/2026 08:30:00');
    expect(iso).toBeTruthy();
    expect(iso).toContain('2026-10-17T');
    expect(parseCommunicatedAt('non-valido')).toBeNull();
  });

  it('parsifica righe CSV sia con pipe che con punto e virgola', () => {
    const pipeCsv = 'idImpianto|descCarburante|prezzo\n101|Benzina|1.789\n102|Gasolio|1.659\n';
    const rowsPipe = parseCsvRows(pipeCsv, 'idImpianto');
    expect(rowsPipe).toHaveLength(2);
    expect(rowsPipe[0]).toEqual({ idImpianto: '101', descCarburante: 'Benzina', prezzo: '1.789' });

    const semiCsv = 'idImpianto;descCarburante;prezzo\n201;GPL;0.719\n';
    const rowsSemi = parseCsvRows(semiCsv, 'idImpianto');
    expect(rowsSemi).toHaveLength(1);
    expect(rowsSemi[0]).toEqual({ idImpianto: '201', descCarburante: 'GPL', prezzo: '0.719' });
  });

  it('aggiorna i prezzi dei distributori esistenti da prezzo_alle_8.csv', () => {
    const stations: FuelStation[] = [
      {
        id: 'osm-1',
        mimitId: '5001',
        brand: 'Eni',
        address: 'Via Roma',
        comune: 'VENEZIA',
        lat: 45.45,
        lon: 12.30,
        highway: false,
        prices: [],
      },
      {
        id: '5002',
        brand: 'Q8',
        address: 'Via Milano',
        comune: 'MESTRE',
        lat: 45.48,
        lon: 12.24,
        highway: false,
        prices: [],
      },
    ];

    const pricesCsv = `Estrazione del 2026-10-17
idImpianto|descCarburante|prezzo|isSelf|dtComu
5001|Benzina|1.759|1|17/10/2026 07:15:00
5001|Gasolio|1.639|1|17/10/2026 07:15:00
5002|Benzina|1.899|0|17/10/2026 06:45:00
9999|Metano|1.299|1|17/10/2026 08:00:00
`;

    const result = parseClientPricesCsv(pricesCsv, stations);
    expect(result.extractedAt).toBe('2026-10-17');
    expect(result.matchedStationsCount).toBe(2);
    expect(result.totalPricesCount).toBe(3);

    const s1 = result.stations.find((s) => s.mimitId === '5001');
    expect(s1).toBeDefined();
    expect(s1?.prices).toHaveLength(2);
    expect(s1?.prices[0].fuel).toBe('Benzina');
    expect(s1?.prices[0].price).toBe(1.759);
    expect(s1?.prices[0].self).toBe(true);

    const s2 = result.stations.find((s) => s.id === '5002');
    expect(s2?.prices).toHaveLength(1);
    expect(s2?.prices[0].self).toBe(false);
  });

  it('parsifica sia anagrafica che prezzi per l area lagunare', () => {
    const anagCsv = `idImpianto|Gestore|Bandiera|Tipo Impianto|Comune|Indirizzo|Latitudine|Longitudine
11944|Societa A|Q8|Altro|VENEZIA|Via Roma 1|45.554818|12.298383
99999|Societa B|Eni|Altro|ROMA|Via del Corso 1|41.90|12.50
`;
    const pricesCsv = `Estrazione del 2026-10-17
idImpianto|descCarburante|prezzo|isSelf|dtComu
11944|Benzina|1.799|1|17/10/2026 08:00:00
99999|Benzina|1.850|1|17/10/2026 08:00:00
`;

    const res = parseClientFullDataset(anagCsv, pricesCsv);
    expect(res.stations).toHaveLength(1);
    expect(res.stations[0].id).toBe('11944');
    expect(res.stations[0].brand).toBe('Q8');
    expect(res.stations[0].prices).toHaveLength(1);
    expect(res.matchedStationsCount).toBe(1);
    expect(res.totalPricesCount).toBe(1);
  });

  it('salva, carica e cancella la cache in localStorage', () => {
    const stations: FuelStation[] = [
      {
        id: '101',
        brand: 'Vega',
        address: 'Via Torino',
        comune: 'Venezia',
        lat: 45.47,
        lon: 12.25,
        highway: false,
        prices: [{ fuel: 'Benzina', self: true, price: 1.72, communicatedAt: '2026-10-17T06:00:00Z' }],
      },
    ];

    saveClientFuelCache(stations, '2026-10-17');
    const cached = loadClientFuelCache();
    expect(cached).toBeTruthy();
    expect(cached?.extractedAt).toBe('2026-10-17');
    expect(cached?.stations).toHaveLength(1);
    expect(cached?.stations[0].prices[0].price).toBe(1.72);

    clearClientFuelCache();
    expect(loadClientFuelCache()).toBeNull();
  });
});
