import { describe, expect, it } from 'vitest';
import data from '@/data/actv-line-colors.json';
import { contrastRatio, MIN_CONTRAST, normalizeHex, officialLineColors, readableTextColor, stopLineColors } from './lineColors';

const HEX = /^#[0-9A-F]{6}$/;

describe('colori ufficiali delle linee per API e MCP', () => {
  it('navigazione ACTV dal GTFS, con il testo del GTFS quando è leggibile', () => {
    expect(officialLineColors('4.1', 'motoscafo')).toEqual({ color: '#B43B96', textColor: '#FFFFFF' });
    expect(officialLineColors('1', 'vaporetto')).toEqual({ color: '#FFFFFF', textColor: '#000000' });
    expect(officialLineColors('13', 'motonave', 'ACTV')).toEqual({ color: '#57419A', textColor: '#FFFFFF' });
  });

  it('testo del GTFS sotto 4,5:1 sostituito da nero o bianco', () => {
    expect(officialLineColors('15', 'motonave').textColor).toBe('#000000'); // arancio su giallo nel GTFS
    expect(officialLineColors('2', 'vaporetto').textColor).toBe('#000000');
    expect(readableTextColor('#000000', '#111111')).toBe('#FFFFFF');
  });

  it('linee omonime: la categoria sceglie navigazione o bus', () => {
    expect(officialLineColors('2', 'vaporetto').color).toBe('#FF0000');
    expect(officialLineColors('2', 'bus').color).toBe(data.busLines['2'].color);
    expect(officialLineColors('N', 'island').color).toBe(data.busLines.N.color);
    expect(officialLineColors('T1', 'tram').color).toMatch(HEX);
  });

  it('Alilaguna dal suo GTFS; altri operatori e linee sconosciute: null', () => {
    expect(officialLineColors('Blu', 'alilaguna', 'Alilaguna').color).toMatch(HEX);
    expect(officialLineColors('Linea Arancio', null, 'Alilaguna').color).toMatch(HEX);
    expect(officialLineColors('Verde', 'alilaguna', 'Alilaguna')).toEqual({ color: null, textColor: null });
    expect(officialLineColors('35', 'coach', 'ATVO')).toEqual({ color: null, textColor: null });
    expect(officialLineColors('RV', 'train', 'Trenitalia')).toEqual({ color: null, textColor: null });
    expect(officialLineColors('99', 'vaporetto')).toEqual({ color: null, textColor: null });
    expect(officialLineColors(null)).toEqual({ color: null, textColor: null });
  });

  it('ogni colore è #RRGGBB maiuscolo e ogni coppia ha contrasto ≥ 4,5:1', () => {
    const all = [
      ...Object.keys(data.lines).map((l) => officialLineColors(l, 'vaporetto')),
      ...Object.keys(data.busLines).map((l) => officialLineColors(l, 'bus')),
      ...['Blu', 'Arancio', 'Rossa'].map((l) => officialLineColors(l, 'alilaguna', 'Alilaguna')),
    ];
    for (const c of all) {
      expect(c.color).toMatch(HEX);
      expect(c.textColor).toMatch(HEX);
      expect(contrastRatio(c.color!, c.textColor!)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });

  it('colori delle linee di una fermata e formato', () => {
    const c = stopLineColors(['4.1', '5.2', 'SA'], 'navigazione');
    expect(Object.keys(c)).toEqual(['4.1', '5.2']); // SA senza colore nel GTFS
    expect(stopLineColors(['T1'], 'tram').T1.color).toMatch(HEX);
    expect(normalizeHex('b43b96')).toBe('#B43B96');
    expect(normalizeHex('rosso')).toBeNull();
  });
});
