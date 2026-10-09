import { NextResponse } from 'next/server';
import {
  ALILAGUNA_ROUTES,
  ALILAGUNA_STOPS,
  getScheduledAlilagunaBoats,
  formatTimeSeconds,
  isAlilagunaTimetableValid,
  ALILAGUNA_FEED_META
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

  const activeBoats = getScheduledAlilagunaBoats(nowSeconds, now);

  return NextResponse.json({
    success: true,
    operator: 'Alilaguna S.p.A.',
    transitlandFeed: {
      onestopId: 'f-u20f-alilagunaspa',
      url: 'https://www.transit.land/feeds/f-u20f-alilagunaspa',
      type: 'GTFS'
    },
    metadata: {
      kind: 'schedule-simulation',
      source: ALILAGUNA_FEED_META.source,
      sourceUrl: ALILAGUNA_FEED_META.sourceUrl,
      license: ALILAGUNA_FEED_META.license,
      feedVersion: ALILAGUNA_FEED_META.feedVersion,
      validFrom: ALILAGUNA_FEED_META.validFrom,
      validTo: ALILAGUNA_FEED_META.validTo,
      timetableValidToday: isAlilagunaTimetableValid(now),
      totalDailyTrips: ALILAGUNA_FEED_META.dailyTrips,
      currentTimeRome: formatTimeSeconds(nowSeconds),
      currentTimeSeconds: nowSeconds,
      notes: 'Simulazione da orario: posizioni interpolate dalle corse del GTFS ufficiale Alilaguna lungo i percorsi pubblicati. Non è un tracciamento GPS delle barche.'
    },
    routesCount: ALILAGUNA_ROUTES.length,
    stopsCount: ALILAGUNA_STOPS.length,
    boatsCount: activeBoats.length,
    routes: ALILAGUNA_ROUTES,
    stops: ALILAGUNA_STOPS,
    boats: activeBoats
  });
}
