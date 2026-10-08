import { NextResponse } from 'next/server';
import {
  ALILAGUNA_ROUTES,
  ALILAGUNA_STOPS,
  getScheduledAlilagunaBoats,
  formatTimeSeconds
} from '@/lib/alilaguna-schedule';

export const revalidate = 60;

export async function GET() {
  // Current time in Venice (Europe/Rome)
  const now = new Date();
  const romeTimeStr = now.toLocaleTimeString('it-IT', {
    timeZone: 'Europe/Rome',
    hour12: false
  });
  const [h, m, s] = romeTimeStr.split(':').map(Number);
  const nowSeconds = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);

  const activeBoats = getScheduledAlilagunaBoats(nowSeconds);

  return NextResponse.json({
    success: true,
    operator: 'Alilaguna S.p.A.',
    transitlandFeed: {
      onestopId: 'f-u20f-alilagunaspa',
      url: 'https://www.transit.land/feeds/f-u20f-alilagunaspa',
      type: 'GTFS Static Open Data'
    },
    metadata: {
      kind: 'schedule-simulation',
      source: 'Transitland Registry (Feed f-u20f-alilagunaspa) / Orari Ufficiali Alilaguna S.p.A.',
      totalDailyTrips: 168,
      lines: ['BLU (76 corse/gg)', 'ARANCIO (66 corse/gg)', 'ROSSA (20 corse/gg)', 'VERDE (6 corse/gg)'],
      currentTimeRome: formatTimeSeconds(nowSeconds),
      currentTimeSeconds: nowSeconds,
      notes: 'Simulazione da orario: le barche in navigazione sono calcolate dagli orari di partenza delle 168 corse giornaliere e interpolate lungo i percorsi dei canali. Non è un tracciamento GPS dei mezzi.'
    },
    routesCount: ALILAGUNA_ROUTES.length,
    stopsCount: ALILAGUNA_STOPS.length,
    boatsCount: activeBoats.length,
    routes: ALILAGUNA_ROUTES,
    stops: ALILAGUNA_STOPS,
    boats: activeBoats
  });
}
