import { describe, expect, it } from 'vitest';
import { lineColor, lineTextColor, luminance, needsDarkOutline } from './actvLines';

describe('colori delle linee ACTV', () => {
  it('usa il colore ufficiale del GTFS per le linee di navigazione', () => {
    expect(lineColor('2', 'vaporetto')).toBe('#FF0000');
    expect(lineColor('4.1', 'vaporetto')).toBe('#B43B96');
    expect(lineColor('5.2', 'motoscafo')).toBe('#8FD2BF');
    expect(lineColor('12', 'motonave')).toBe('#DAD635');
    expect(lineColor('17', 'ferry')).toBe('#82868C');
  });

  it('bus e tram e linee sconosciute restano senza colore di linea', () => {
    expect(lineColor('2', 'bus')).toBeNull();
    expect(lineColor('T1', 'tram')).toBeNull();
    expect(lineColor('99', 'vaporetto')).toBeNull();
    expect(lineColor(null)).toBeNull();
  });

  it('testo leggibile e bordo per i colori chiari', () => {
    expect(lineTextColor('1', '#FFFFFF')).toBe('#000000');
    expect(lineTextColor(null, '#000000')).toBe('#FFFFFF');
    expect(needsDarkOutline('#FFFFFF')).toBe(true);
    expect(needsDarkOutline('#FF0000')).toBe(false);
    expect(luminance('#000000')).toBe(0);
  });
});
