import { describe, expect, it } from 'vitest';
import { fuelKindOf, fuelRankColor, fuelSummary, fuelZoneOf, rankFuelStations, stationFromOsm, stationPrice, withOsmDetails, type FuelStation, type OsmFuelRecord } from './fuel';

const NOW = Date.parse('2026-10-16T10:00:00Z');
const recent = '2026-10-15T06:00:00.000Z';

const station = (id: string, prices: [string, boolean, number, string | null][]): FuelStation => ({
  id,
  lat: 45.4,
  lon: 12.3,
  brand: 'Test',
  address: 'Via Test 1',
  comune: 'VENEZIA',
  highway: false,
  prices: prices.map(([fuel, self, price, communicatedAt]) => ({ fuel, self, price, communicatedAt })),
});

describe('carburanti', () => {
  it('riconosce solo i carburanti confrontabili', () => {
    expect(fuelKindOf('Benzina')).toBe('benzina');
    expect(fuelKindOf('GPL')).toBe('gpl');
    expect(fuelKindOf('Blue Diesel')).toBeNull();
  });

  it('usa il prezzo più basso tra self e servito, escludendo quelli vecchi', () => {
    const s = station('1', [
      ['Benzina', false, 1.95, recent],
      ['Benzina', true, 1.81, recent],
      ['Benzina', true, 1.5, '2021-03-01T08:00:00.000Z'],
    ]);
    expect(stationPrice(s, 'benzina', NOW)?.price).toBe(1.81);
    expect(stationPrice(s, 'gasolio', NOW)).toBeNull();
  });

  it('ordina i distributori dal più economico al più caro, con le parità a metà', () => {
    const ranks = rankFuelStations(
      [
        station('a', [['Gasolio', true, 1.7, recent]]),
        station('b', [['Gasolio', true, 1.8, recent]]),
        station('c', [['Gasolio', true, 1.8, recent]]),
        station('d', [['Gasolio', true, 1.9, recent]]),
        station('e', [['Benzina', true, 1.8, recent]]),
      ],
      'gasolio',
      NOW,
    );
    expect(ranks.get('a')).toMatchObject({ rank: 0, position: 1, total: 4 });
    expect(ranks.get('b')?.rank).toBeCloseTo(0.5);
    expect(ranks.get('c')?.position).toBe(2);
    expect(ranks.get('d')?.rank).toBe(1);
    expect(ranks.has('e')).toBe(false);
  });

  it('assegna le zone di Venezia', () => {
    const z = (comune: string, lat: number, lon: number) => fuelZoneOf({ comune, lat, lon });
    expect(z('VENEZIA', 45.448, 12.321)).toBe('centro'); // Sacca San Girolamo
    expect(z('VENEZIA', 45.487, 12.416)).toBe('centro'); // Burano
    expect(z('VENEZIA', 45.4199, 12.3753)).toBe('lido'); // Riviera San Nicolò
    expect(z('VENEZIA', 45.264, 12.301)).toBe('lido'); // Pellestrina
    expect(z('VENEZIA', 45.418, 12.258)).toBe('terraferma'); // Fusina
    expect(z('VENEZIA', 45.49, 12.24)).toBe('terraferma'); // Mestre
    expect(z('VENEZIA', 45.504, 12.336)).toBe('terraferma'); // Tessera
    expect(z('CHIOGGIA', 45.22, 12.28)).toBe('chioggia');
    expect(z('MIRA', 45.44, 12.14)).toBe('altri');
  });

  it('riassume prezzi per zona, servito e prezzi vecchi', () => {
    const at = (s: FuelStation, lat: number, lon: number, highway = false) => ({ ...s, lat, lon, highway });
    const sum = fuelSummary(
      [
        at(station('c', [['Benzina', true, 2.4, recent], ['Benzina', false, 2.5, recent]]), 45.44, 12.33),
        at(station('m1', [['Benzina', true, 1.9, recent], ['Benzina', false, 2.1, recent]]), 45.49, 12.24),
        at(station('m2', [['Benzina', true, 2.0, recent]]), 45.49, 12.24, true),
        at(station('old', [['Benzina', true, 1.5, '2021-03-01T08:00:00.000Z']]), 45.49, 12.24),
      ],
      'benzina',
      NOW,
      [{ comune: 'VENEZIA', lat: 45.457, lon: 12.345 }],
    );
    expect(sum.all).toMatchObject({ count: 3, total: 4, withoutPrices: 1, median: 2.0 });
    expect(sum.byZone.centro.withoutPrices).toBe(1);
    expect(sum.all.min?.station.id).toBe('m1');
    expect(sum.all.max?.price).toBe(2.4);
    expect(sum.byZone.centro.count).toBe(1);
    expect(sum.byZone.terraferma).toMatchObject({ count: 2, mean: 1.95 });
    expect(sum.byZone.lido.count).toBe(0);
    expect(sum.stale).toBe(1);
    expect(sum.attendedPremium).toBeCloseTo(0.15);
    expect(sum.highwayPremium).toBeCloseTo(2.0 - 2.15);
  });

  it('distributori di OpenStreetMap: senza prezzi da soli, oppure orari e barche accanto ai prezzi', () => {
    const osm: OsmFuelRecord = { id: 'osm-node-1', osmUrl: 'https://www.openstreetmap.org/node/1', lat: 45.44, lon: 12.32, brand: null, address: null, comune: null, boat: true, fuels: ['Gasolio'], openingHours: 'Mo-Sa 07:30-12:30', mimitId: '42' };
    expect(stationFromOsm(osm)).toMatchObject({ brand: '', prices: [], osm: { boat: true, fuels: ['Gasolio'] } });
    const [linked, other] = withOsmDetails([station('42', [['Gasolio', true, 2.5, recent]]), station('7', [])], [osm]);
    expect(linked.osm?.openingHours).toBe('Mo-Sa 07:30-12:30');
    expect(other.osm).toBeUndefined();
  });

  it('colora dal verde al rosso', () => {
    expect(fuelRankColor(0)).toBe('rgb(22, 163, 74)');
    expect(fuelRankColor(0.5)).toBe('rgb(234, 179, 8)');
    expect(fuelRankColor(1)).toBe('rgb(220, 38, 38)');
  });
});
