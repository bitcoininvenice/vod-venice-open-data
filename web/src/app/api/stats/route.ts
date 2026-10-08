import { NextResponse } from 'next/server';
import { fetchPlatformMetrics } from '@/lib/db';
import { SHIPS_REFERENCE } from '@/lib/shipsData';
import { SATELLITES_DATA } from '@/lib/satellitesData';
import { PASSERELLE_DATA } from '@/lib/passerelleData';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { romeSecondsOfDay } from '@/lib/time';
import { fetchUpstream } from '@/server/upstream';
import { REFERENCE_STATION_ID, TIDE_LEVELS_URL, parseTideLevels } from '@/server/sources/tide';
import { OPENSKY_STATES_URL, parseOpenSkyStates } from '@/server/sources/opensky';
import { gtfsNetworkStats } from '@/server/sources/gtfsStats';

export const revalidate = 60;

export async function GET() {
  // Stesse URL e stessa cache di /api/tide e /api/flights: nessuna chiamata upstream aggiuntiva.
  const [tide, flights] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 120 }),
    fetchUpstream(OPENSKY_STATES_URL, parseOpenSkyStates, { revalidate: 15 }),
  ]);

  const metrics = await fetchPlatformMetrics({
    ...gtfsNetworkStats(),
    alilagunaBoatsNow: getScheduledAlilagunaBoats(Math.floor(romeSecondsOfDay())).length,
    shipsCount: SHIPS_REFERENCE.length,
    shipsGrossTonnage: SHIPS_REFERENCE.reduce((acc, s) => acc + (s.grossTonnage || 0), 0),
    tideLevelCm: tide.ok ? tide.data.find((s) => s.id === REFERENCE_STATION_ID)?.levelCm ?? null : null,
    activeFlightsCount: flights.ok ? flights.data.length : null,
    satellitesCount: SATELLITES_DATA.length,
    passerelleTotalMeters: PASSERELLE_DATA.reduce((acc, p) => acc + p.lengthMeters, 0),
    passerelleMountedCount: PASSERELLE_DATA.filter((p) => p.isMounted).length,
  });

  return NextResponse.json({ success: true, data: metrics });
}
