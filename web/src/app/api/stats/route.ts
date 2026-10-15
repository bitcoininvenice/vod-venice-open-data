import { NextResponse } from 'next/server';
import { fetchPlatformMetrics } from '@/lib/db';
import { peekShipsCount } from '@/server/sources/aisstream';
import { SATELLITES_DATA } from '@/lib/satellitesData';
import { PASSERELLE_ROUTES, PASSERELLE_TOTAL_METERS } from '@/lib/passerelleData';
import { expectedPasserelle } from '@/lib/passerelle';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { romeSecondsOfDay } from '@/lib/time';
import { fetchUpstream } from '@/server/upstream';
import { REFERENCE_STATION_ID, TIDE_LEVELS_URL, parseTideLevels } from '@/server/sources/tide';
import { openSkyFlights } from '@/server/sources/openskyClient';
import { gtfsNetworkStats } from '@/server/sources/gtfsStats';
import { CPSM_METEO_URLS, parseCpsmFeed, platformReadings } from '@/server/sources/cpsmMeteo';

export const revalidate = 60;

export async function GET() {
  // Stessa cache di /api/tide e stessa lettura OpenSky di /api/flights (openskyClient): nessuna chiamata in più.
  const [tide, flights, waves, waterTemp] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 60 }),
    openSkyFlights(),
    fetchUpstream(CPSM_METEO_URLS.ondeMare, parseCpsmFeed, { revalidate: 300 }),
    fetchUpstream(CPSM_METEO_URLS.tempAcqua, parseCpsmFeed, { revalidate: 300 }),
  ]);
  const platform = platformReadings({
    ondeMare: waves.ok ? waves.data : undefined,
    tempAcqua: waterTemp.ok ? waterTemp.data : undefined,
  });

  const tideLevelCm = tide.ok ? tide.data.find((s) => s.id === REFERENCE_STATION_ID)?.levelCm ?? null : null;
  const metrics = await fetchPlatformMetrics({
    ...gtfsNetworkStats(),
    alilagunaBoatsNow: getScheduledAlilagunaBoats(Math.floor(romeSecondsOfDay())).length,
    shipsCount: peekShipsCount(),
    tideLevelCm,
    activeFlightsCount: flights.ok && !flights.stale ? flights.flights.length : null,
    satellitesCount: SATELLITES_DATA.length,
    passerelleTotalMeters: PASSERELLE_TOTAL_METERS,
    // percorsi previsti dal piano con la marea misurata adesso
    passerelleMountedCount: expectedPasserelle(PASSERELLE_ROUTES, tideLevelCm).length,
    cpsmStationsCount: tide.ok ? tide.data.length : null,
    cnrWaveHeightMeters: platform.waveHeightMeters,
    cnrWaterTempC: platform.waterTempC,
  });

  return NextResponse.json({ success: true, data: metrics });
}
