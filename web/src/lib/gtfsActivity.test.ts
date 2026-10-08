import { describe, expect, it } from 'vitest';
import { activeTripsAt, dayActivity } from './gtfsActivity';

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
