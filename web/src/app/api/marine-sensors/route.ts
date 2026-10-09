import { NextResponse } from 'next/server';
import { OCEAN_STATIONS_DATA, BRICCOLE_SIGNALS_DATA } from '@/lib/marineSensorsData';
import lagoonNetwork from '@/data/osm-waterways.json';
import { curatedNotInOsm } from '@/lib/osmPoi';

// Le briccole dell'elenco curato restano solo se non c'è un segnalamento OSM entro 30 m
const OSM_MARKERS = (lagoonNetwork.markers as number[][]).map(([lon, lat]) => ({ lon, lat }));
const CURATED_BRICCOLE = curatedNotInOsm(BRICCOLE_SIGNALS_DATA, OSM_MARKERS, 30);
import { fetchUpstream } from '@/server/upstream';
import { CPSM_METEO_URLS, parseCpsmFeed, platformReadings, type CpsmFeedName } from '@/server/sources/cpsmMeteo';
import { MARINE_SOURCE, marineUrl, parseMarine } from '@/server/sources/openMeteoMarine';

export const revalidate = 300;

const FEEDS: CpsmFeedName[] = ['ondeMare', 'tempAcqua', 'vento'];

export async function GET() {
  const platform = OCEAN_STATIONS_DATA.find((st) => st.id === 'CNR-PLAT-01');
  const [results, marine] = await Promise.all([
    Promise.all(FEEDS.map((f) => fetchUpstream(CPSM_METEO_URLS[f], parseCpsmFeed, { revalidate: 300 }))),
    platform
      ? fetchUpstream(marineUrl(platform.lat, platform.lon), parseMarine, { revalidate: 1800, timeoutMs: 8000 })
      : Promise.resolve(null),
  ]);
  const feeds = Object.fromEntries(FEEDS.flatMap((f, i) => (results[i].ok ? [[f, results[i].data]] : [])));
  const live = platformReadings(feeds);
  const hasLive = live.waveHeightMeters !== null || live.waterTempC !== null;

  const forecast = marine && marine.ok ? marine.data : null;
  const oceanStations = OCEAN_STATIONS_DATA.map((st) => (st.id === 'CNR-PLAT-01' ? { ...st, forecast } : st)).map((st) =>
    st.id === 'CNR-PLAT-01' && hasLive
      ? {
          ...st,
          waveHeightMeters: live.waveHeightMeters,
          waterTempC: live.waterTempC,
          windSpeedKnots: live.windSpeedKnots,
          windDirectionDeg: live.windDirectionDeg,
          observedAt: live.observedAt ? live.observedAt.slice(11, 16) : null,
          officialSource: 'Comune di Venezia – CPSM (dati.venezia.it), piattaforma CNR-ISMAR "Acqua Alta"',
        }
      : st,
  );

  return NextResponse.json({
    success: true,
    oceanStationsCount: oceanStations.length,
    briccoleCount: CURATED_BRICCOLE.length,
    data: {
      oceanStations,
      briccole: CURATED_BRICCOLE,
    },
    meta: {
      kind: hasLive ? 'live' : 'static-reference',
      source: 'CPSM (piattaforma Acqua Alta) + anagrafica stazioni e segnalamenti',
      sourceUrl: 'https://dati.venezia.it/?q=content/cpsm-dati-meteomarini-laguna-e-litorale-veneziano',
      note: 'Solo la piattaforma "Acqua Alta" ha misure in tempo reale; per le altre stazioni non è collegata una fonte aperta.',
      forecastSource: `${MARINE_SOURCE} – previsione, non misura (CC BY 4.0)`,
    },
  });
}
