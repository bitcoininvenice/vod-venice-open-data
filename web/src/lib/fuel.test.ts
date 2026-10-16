import { describe, expect, it } from 'vitest';
import { fuelKindOf, fuelRankColor, rankFuelStations, stationPrice, type FuelStation } from './fuel';

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

  it('colora dal verde al rosso', () => {
    expect(fuelRankColor(0)).toBe('rgb(22, 163, 74)');
    expect(fuelRankColor(0.5)).toBe('rgb(234, 179, 8)');
    expect(fuelRankColor(1)).toBe('rgb(220, 38, 38)');
  });
});
