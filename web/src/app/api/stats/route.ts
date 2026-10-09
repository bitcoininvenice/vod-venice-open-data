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
import { CPSM_METEO_URLS, parseCpsmFeed, platformReadings } from '@/server/sources/cpsmMeteo';

export const revalidate = 60;

export async function GET() {
  // Stesse URL e stessa cache di /api/tide e /api/flights: nessuna chiamata upstream aggiuntiva.
  const [tide, flights, waves, waterTemp] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 60 }),
    fetchUpstream(OPENSKY_STATES_URL, parseOpenSkyStates, { revalidate: 15 }),
    fetchUpstream(CPSM_METEO_URLS.ondeMare, parseCpsmFeed, { revalidate: 300 }),
    fetchUpstream(CPSM_METEO_URLS.tempAcqua, parseCpsmFeed, { revalidate: 300 }),
  ]);
  const platform = platformReadings({
    ondeMare: waves.ok ? waves.data : undefined,
    tempAcqua: waterTemp.ok ? waterTemp.data : undefined,
  });

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
    cpsmStationsCount: tide.ok ? tide.data.length : null,
    cnrWaveHeightMeters: platform.waveHeightMeters,
    cnrWaterTempC: platform.waterTempC,
  });

  return NextResponse.json({ success: true, data: metrics });
}
