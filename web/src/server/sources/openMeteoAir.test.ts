import { describe, expect, it } from 'vitest';
import { airQualityUrl, europeanAqiBand, overallPollenLevel, parseAirQuality, pollenLevel } from './openMeteoAir';
import { parseMarine } from './openMeteoMarine';

const point = {
  current: {
    time: '2026-10-09T11:00', pm10: 12.34, pm2_5: 6, nitrogen_dioxide: 20, ozone: 68, european_aqi: 35, uv_index: 1.25,
    alder_pollen: 0, birch_pollen: null, grass_pollen: 12, mugwort_pollen: 0.1, olive_pollen: 30, ragweed_pollen: 2,
  },
  hourly: {
    time: ['2026-10-09T10:00', '2026-10-09T11:00', '2026-10-09T12:00', '2026-10-10T12:00'],
    european_aqi: [30, 35, 40, 20],
    uv_index: [0.6, 1.25, 1.9, 2.5],
  },
};

describe('Open-Meteo qualità aria e pollini (CAMS)', () => {
  it('chiede tutti i punti e le variabili in una richiesta', () => {
    const url = new URL(airQualityUrl([{ lat: 45.43, lon: 12.33 }, { lat: 45.49, lon: 12.24 }]));
    expect(url.searchParams.get('latitude')).toBe('45.4300,45.4900');
    expect(url.searchParams.get('current')).toContain('grass_pollen');
  });

  it('legge valori correnti, UV massimo di oggi e indice delle prossime ore', () => {
    const [p] = parseAirQuality([point]);
    expect(p.air.pm10).toBe(12.3);
    expect(p.air.europeanAqi).toBe(35);
    expect(p.air.uvMaxToday).toBe(1.9); // solo le ore di oggi
    expect(p.air.aqiNext24h).toEqual([35, 40, 20]); // dall'ora corrente in poi
  });

  it('classifica i pollini per famiglia e prende il livello più alto', () => {
    const [p] = parseAirQuality([point]);
    const by = Object.fromEntries(p.pollens.map((x) => [x.key, x.level]));
    expect(by).toEqual({ alder: 'ASSENTE', birch: 'ASSENTE', grass: 'MEDIO', mugwort: 'ASSENTE', olive: 'ALTO', ragweed: 'BASSO' });
    expect(overallPollenLevel(p.pollens)).toBe('ALTO');
    expect(pollenLevel('grass', 9.9)).toBe('BASSO');
  });

  it('assegna la classe dell’indice europeo', () => {
    expect(europeanAqiBand(15)).toBe('good');
    expect(europeanAqiBand(55)).toBe('moderate');
    expect(europeanAqiBand(120)).toBe('extremelyPoor');
    expect(europeanAqiBand(null)).toBeNull();
  });

  it('rifiuta risposte senza valori correnti', () => {
    expect(() => parseAirQuality([{}])).toThrow();
  });
});

describe('Open-Meteo marina', () => {
  it('legge onda, temperatura e massimo previsto', () => {
    const f = parseMarine({
      current: { time: '2026-10-09T11:30', wave_height: 0.46, wave_direction: 131, wave_period: 3.95, sea_surface_temperature: 22.8 },
      hourly: { time: ['a', 'b', 'c'], wave_height: [0.4, 1.2, null] },
    });
    expect(f).toMatchObject({ waveHeightM: 0.46, seaTempC: 22.8, waveMax72hM: 1.2, waveMax72hAt: 'b' });
    expect(() => parseMarine({})).toThrow();
  });
});
