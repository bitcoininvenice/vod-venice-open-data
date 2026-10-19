import { describe, it, expect } from 'vitest';
import {
  AIRBNB_DATA,
  AIRBNB_LISTING_POINTS,
  AIRBNB_ZONES,
  AIRBNB_ROOM_COLORS,
  getAirbnbDetailedStats,
  airbnbCellClass,
  airbnbCellBounds,
} from './airbnb';

describe('airbnb dataset and detailed stats', () => {
  it('contiene gli 8.844 annunci geolocalizzati e le 14 macro-zone', () => {
    expect(AIRBNB_DATA.totalListings).toBe(8844);
    expect(AIRBNB_LISTING_POINTS.length).toBeGreaterThan(5000);
    expect(AIRBNB_ZONES).toHaveLength(14);
    expect(AIRBNB_DATA.city.totalStructures).toBe(8844);
    expect(AIRBNB_DATA.historicCentre.totalStructures).toBe(6248);
  });

  it('assegna colori distinti per ogni tipologia di alloggio', () => {
    expect(AIRBNB_ROOM_COLORS.entire_home_apt).toBe('#f43f5e');
    expect(AIRBNB_ROOM_COLORS.private_room).toBe('#a855f7');
    expect(AIRBNB_ROOM_COLORS.hotel_room).toBe('#0ea5e9');
    expect(AIRBNB_ROOM_COLORS.shared_room).toBe('#f59e0b');
  });

  it('calcola classi e limiti corretti per le celle di densità a 100 metri', () => {
    expect(airbnbCellClass(1)).toBe(1);
    expect(airbnbCellClass(4)).toBe(2);
    expect(airbnbCellClass(10)).toBe(3);
    expect(airbnbCellClass(25)).toBe(4);

    const b = airbnbCellBounds(AIRBNB_DATA, 10, 20);
    expect(b.lon1).toBeGreaterThan(b.lon0);
    expect(b.lat1).toBeGreaterThan(b.lat0);
  });

  it('calcola statistiche di dettaglio coerenti sui prezzi, tipologie e host', () => {
    const stats = getAirbnbDetailedStats();

    // solo i punti pubblicati (non quelli delle celle con meno di 3 annunci)
    expect(stats.pricedListingsCount).toBeGreaterThan(5000);
    expect(stats.p10PriceEur).toBeLessThan(stats.p25PriceEur!);
    expect(stats.p25PriceEur!).toBeLessThan(stats.p75PriceEur!);
    expect(stats.p75PriceEur!).toBeLessThan(stats.p90PriceEur!);

    // Il centro storico ha prezzi sensibilmente più alti della terraferma
    expect(stats.historicvsMainlandPriceRatio).toBeGreaterThan(1.8);

    // 4 tipologie di stanza
    expect(stats.byRoomType).toHaveLength(4);
    const entire = stats.byRoomType.find((r) => r.roomType === 'entire_home_apt')!;
    expect(entire.sharePct).toBeGreaterThan(70);
    expect(entire.meanPriceEur).toBeGreaterThan(250);

    // Fasce di prezzo
    expect(stats.priceBrackets).toHaveLength(5);
    const totalBracketCount = stats.priceBrackets.reduce((s, b) => s + b.count, 0);
    expect(totalBracketCount).toBe(stats.pricedListingsCount);

    // Fasce host
    expect(stats.hostBrackets).toHaveLength(4);
    expect(stats.maxHostPortfolioSize).toBeGreaterThan(50);

    // Tutte le 14 zone hanno dettagli di prezzo
    expect(Object.keys(stats.zoneDetails)).toHaveLength(14);
    const sanMarco = stats.zoneDetails['ACC_SAN_MARCO'];
    expect(sanMarco).toBeDefined();
    expect(sanMarco.entireMeanEur).toBeGreaterThan(350);

    // Statistiche griglia
    expect(stats.gridStats.totalCells).toBe(1560);
    expect(stats.gridStats.highDensityCells10Plus).toBeGreaterThan(100);
    expect(stats.gridStats.extremeDensityCells20Plus).toBeGreaterThan(20);
    expect(stats.gridStats.maxListingsInSingleCell).toBeGreaterThanOrEqual(40);
  });
});
