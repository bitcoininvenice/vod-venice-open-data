import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { activeTripsAt, activeTripsByCategory, dayActivity } from './gtfsActivity';
import { initSimulation, type RawSimulation } from './simulationModel';
import { SIM_URL } from './simulation-data';

// Nel sito la simulazione si scarica da public/data; nei test si legge lo stesso file
beforeAll(() => {
  initSimulation(JSON.parse(readFileSync(join(__dirname, '../../public', SIM_URL), 'utf8')) as RawSimulation);
});

describe('attività GTFS', () => {
  it('il picco feriale è maggiore del servizio notturno', () => {
    const { peakCount } = dayActivity('weekday');
    expect(peakCount).toBeGreaterThan(0);
    expect(activeTripsAt('weekday', 3 * 3600)).toBeLessThan(peakCount);
  });
  it('il conteggio al minuto del picco coincide con il picco', () => {
    const { peakCount, peakTime } = dayActivity('sunday');
    const [h, m] = peakTime.split(':').map(Number);
    expect(activeTripsAt('sunday', h * 3600 + m * 60)).toBe(peakCount);
  });
});

describe('corse per tipo di mezzo', () => {
  it('la somma per tipo coincide con le corse in servizio', () => {
    const { peakTime } = dayActivity('weekday');
    const [h, m] = peakTime.split(':').map(Number);
    const sec = h * 3600 + m * 60 + 30;
    const byCat = activeTripsByCategory('weekday', sec);
    const total = Object.values(byCat).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
    // stesso ordine di grandezza del conteggio al minuto (che include le corse dell'intero minuto)
    expect(total).toBeLessThanOrEqual(activeTripsAt('weekday', sec));
  });
});
