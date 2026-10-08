import { describe, expect, it } from 'vitest';
import metar from '@/test/fixtures/metar-lipz.json';
import { compassPoint, parseLipzMetar, relativeHumidity, visibilityFromRaw } from './metar';

describe('parseLipzMetar', () => {
  it('riporta il METAR grezzo e i valori così come pubblicati', () => {
    const m = parseLipzMetar(metar);
    expect(m.rawMetar).toBe(metar[0].rawOb);
    expect(m.windDirectionDeg).toBe(metar[0].wdir);
    expect(m.windSpeedKnots).toBe(metar[0].wspd);
    expect(m.temperatureCelsius).toBe(metar[0].temp);
    expect(m.qnhHpa).toBe(metar[0].altim);
    expect(m.flightCategory).toBe(metar[0].fltCat);
    expect(m.observationTime).toBe(metar[0].reportTime);
  });

  it('stima la pista dal vento senza dichiararla come pista in uso', () => {
    expect(parseLipzMetar(metar).activeRunway).toMatch(/stima/);
    const southWind = [{ ...metar[0], wdir: 220 }];
    expect(parseLipzMetar(southWind).activeRunway).toMatch(/^RWY 22/);
  });

  it('gestisce vento variabile', () => {
    const vrb = [{ ...metar[0], wdir: 'VRB', rawOb: 'METAR LIPZ 080020Z VRB02KT CAVOK 18/17 Q1012' }];
    const m = parseLipzMetar(vrb);
    expect(m.windCompass).toBe('Variabile');
    expect(m.crosswindKnots).toBe(0);
    expect(m.visibilityMeters).toBe(10000);
  });

  it('rifiuta una risposta vuota', () => {
    expect(() => parseLipzMetar([])).toThrow();
  });
});

describe('helper METAR', () => {
  it('visibilità dal gruppo METAR', () => {
    expect(visibilityFromRaw('METAR LIPZ 080020Z 04007KT 6000 -RA FEW020')).toBe(6000);
    expect(visibilityFromRaw('METAR LIPZ 080020Z 04007KT 9999 FEW020')).toBe(9999);
    expect(visibilityFromRaw('METAR LIPZ 080020Z 04007G17KT CAVOK')).toBe(10000);
  });
  it('umidità relativa (Magnus)', () => {
    expect(relativeHumidity(18, 18)).toBe(100);
    expect(relativeHumidity(18, 17)).toBeGreaterThan(90);
  });
  it('punti cardinali', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(40)).toBe('NE');
    expect(compassPoint(225)).toBe('SO');
    expect(compassPoint(359)).toBe('N');
  });
});
