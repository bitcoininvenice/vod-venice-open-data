import { NextResponse } from 'next/server';
import {
  ALILAGUNA_ROUTES,
  ALILAGUNA_STOPS,
  getScheduledAlilagunaBoats,
  formatTimeSeconds
} from '@/lib/alilaguna-schedule';

export const dynamic = 'force-dynamic';

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
      regime: 'ORARIO_UFFICIALE_DETERMINISTICO',
      source: 'Transitland Registry (Feed f-u20f-alilagunaspa) / Orari Ufficiali Alilaguna S.p.A.',
      totalDailyTrips: 168,
      lines: ['BLU (76 corse/gg)', 'ARANCIO (66 corse/gg)', 'ROSSA (20 corse/gg)', 'VERDE (6 corse/gg)'],
      currentTimeRome: formatTimeSeconds(nowSeconds),
      currentTimeSeconds: nowSeconds,
      notes: 'Gemello digitale deterministico del servizio di trasporto pubblico aeroportuale lagunare Alilaguna. La flotta in navigazione è calcolata istante per istante in base alle 168 corse giornaliere certificate, orari di partenza dai pontili e interpolazione cinematica lungo le polilinee dei canali navigabili autorizzati.'
    },
    routesCount: ALILAGUNA_ROUTES.length,
    stopsCount: ALILAGUNA_STOPS.length,
    boatsCount: activeBoats.length,
    routes: ALILAGUNA_ROUTES,
    stops: ALILAGUNA_STOPS,
    boats: activeBoats
  });
}
