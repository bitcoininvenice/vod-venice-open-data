import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { assess, fromRomeLocal, type SourceHealth } from '@/server/sourceHealth';
import { REFERENCE_STATION_ID, TIDE_FORECAST_URL, TIDE_LEVELS_URL, parseTideForecast, parseTideLevels } from '@/server/sources/tide';
import { LIPZ_METAR_URL, parseLipzMetar } from '@/server/sources/metar';
import { ACTV_GTFS_RT_FEEDS, parseVehiclePositions } from '@/server/sources/gtfsRt';
import { CPSM_METEO_URLS, parseCpsmFeed } from '@/server/sources/cpsmMeteo';
import { openSkyFlights } from '@/server/sources/openskyClient';
import { getShipsSnapshot } from '@/server/sources/aisstream';
import { PACKET_BROKER_URL, parseGateways } from '@/server/sources/packetBroker';
import { CAMPO_API_URL, parseCampo } from '@/server/sources/campo';
import { AMBITI, ORDINANCES_API, parseOrdinanceList } from '@/server/sources/comuneOrdinances';
import { parseRss } from '@/server/sources/actvNotices';
import { ACTV_RSS_URL } from '@/lib/contracts/actvNotices';
import osmToponyms from '@/data/osm-toponyms.json';
import calliCuriosita from '@/data/calli-curiosita.json';
import flixbusData from '@/data/flixbus-venezia.json';
import { openMeteoWindUrl, parseOpenMeteoWind } from '@/server/sources/openMeteoWind';
import { airQualityUrl, parseAirQuality } from '@/server/sources/openMeteoAir';
import { marineUrl, parseMarine } from '@/server/sources/openMeteoMarine';
import { ARPAV_AIR_META, ARPAV_AIR_STATIONS } from '@/lib/airQuality';
import { OCEAN_STATIONS_DATA } from '@/lib/marineSensorsData';
import { GTFS_INDEX_GENERATED_AT } from '@/server/sources/gtfsIndex';
import { OPERE_PUBBLICHE_META } from '@/lib/db';
import { WIFI_HOTSPOTS_META } from '@/lib/urbanAssetsVeniceData';
import { OSM_SURVEILLANCE_META } from '@/lib/cameras-data';
import { OSM_DAE_META } from '@/lib/dae-data';
import { OSM_PHARMACIES_META } from '@/lib/pharmacies-data';
import fountainsDataset from '@/data/fountains.json';
import veniceTapWater from '@/data/venice-tap-water.json';
import { OSM_POI_META } from '@/lib/osmPoi';
import { ALILAGUNA_FEED_META, isAlilagunaTimetableValid } from '@/lib/alilaguna-schedule';
import fiberDataset from '@/data/agcom-fiber.json';
import lagoonDataset from '@/data/osm-waterways.json';
import parksDataset from '@/data/osm-parks.json';
import civiciDataset from '@/data/osm-civici.json';
import { WALK_STATS } from '@/lib/walk-data';
import { BOAT_STATS } from '@/lib/boat-data';
import pollenDataset from '@/data/arpav-pollen-venezia.json';
import tourismDataset from '@/data/turismo-comuni.json';
import lagoonProbeDataset from '@/data/arpav-lagoon.json';
import cruscottoDataset from '@/data/cruscotto-comuni.json';
import censusDataset from '@/data/istat-census-venezia.json';
import bdapDataset from '@/data/bdap-opere-venezia.json';
import { SITE_URL } from '@/lib/site';

export const revalidate = 60;

const DAY = 24 * 60;

/** Data dell'estrazione dei prezzi dalla risposta di /api/carburanti; errore se la route non ha dati */
function parseFuelStatus(raw: unknown): string {
  const j = raw as { success?: boolean; meta?: { extractedAt?: unknown; error?: unknown } };
  if (!j?.success || typeof j.meta?.extractedAt !== 'string') throw new Error(String(j?.meta?.error ?? 'senza dati'));
  return j.meta.extractedAt;
}
const ACQUA_ALTA = OCEAN_STATIONS_DATA.find((s) => s.id === 'CNR-PLAT-01') ?? { lat: 45.3231, lon: 12.5147 };

/**
 * Stato delle fonti: per i dati live l'età dell'ultima misura, per i dataset generati dalla
 * pipeline la data di generazione. Usabile da un monitor esterno (es. uptime check su "status").
 */
export async function GET() {
  const now = new Date();
  const [levels, forecast, metar, rtNav, rtAut, wind, flights, fuel, windField, cams, marine, ais, lora, campo, ordinances, actvRss] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 60 }),
    fetchUpstream(TIDE_FORECAST_URL, (raw) => parseTideForecast(raw, now), { revalidate: 600 }),
    fetchUpstream(LIPZ_METAR_URL, parseLipzMetar, { revalidate: 300 }),
    fetchUpstream(ACTV_GTFS_RT_FEEDS.navigazione, (raw) => parseVehiclePositions(raw as ArrayBuffer), { revalidate: 20, responseType: 'arrayBuffer' }),
    fetchUpstream(ACTV_GTFS_RT_FEEDS.automobilistico, (raw) => parseVehiclePositions(raw as ArrayBuffer), { revalidate: 20, responseType: 'arrayBuffer' }),
    fetchUpstream(CPSM_METEO_URLS.vento, parseCpsmFeed, { revalidate: 300 }),
    openSkyFlights(),
    // i prezzi dei carburanti si leggono dalla nostra route (cache del CDN): un solo download dal Ministero
    fetchUpstream(`${SITE_URL}/api/carburanti`, parseFuelStatus, { revalidate: 600, timeoutMs: 20000 }),
    fetchUpstream(openMeteoWindUrl(), parseOpenMeteoWind, { revalidate: 1800, timeoutMs: 8000 }),
    fetchUpstream(airQualityUrl(ARPAV_AIR_STATIONS), parseAirQuality, { revalidate: 1800, timeoutMs: 8000 }),
    fetchUpstream(marineUrl(ACQUA_ALTA.lat, ACQUA_ALTA.lon), parseMarine, { revalidate: 1800, timeoutMs: 8000 }),
    getShipsSnapshot(5_000),
    fetchUpstream(PACKET_BROKER_URL, parseGateways, { revalidate: 600, timeoutMs: 8000 }),
    fetchUpstream(CAMPO_API_URL, parseCampo, { revalidate: 3600, timeoutMs: 8000 }),
    fetchUpstream(`${ORDINANCES_API}/filtra?numeroPagina=0&elementiPerPagina=20&idAmbito=${AMBITI.trafficoAcqueo}`, parseOrdinanceList, { revalidate: 3600, timeoutMs: 8000 }),
    fetchUpstream(ACTV_RSS_URL, (raw) => parseRss(String(raw)), { responseType: 'text', revalidate: 900, timeoutMs: 8000 }),
  ]);

  const newestVehicle = (r: typeof rtNav) =>
    r.ok && r.data.length > 0 ? new Date(Math.max(...r.data.map((v) => (v.timestamp ?? 0) * 1000))) : null;
  const newestWind = wind.ok
    ? wind.data.map((r) => fromRomeLocal(r.observedAt)).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null
    : null;
  const reference = levels.ok ? levels.data.find((s) => s.id === REFERENCE_STATION_ID) : undefined;

  const sources: SourceHealth[] = [
    assess('tide', 'live', fromRomeLocal(reference?.observedAt), 30, now),
    assess('tide-forecast', 'live', forecast.ok ? fromRomeLocal(forecast.data?.issuedAt) : null, DAY, now,
      'emissione dell\'ultima previsione'),
    assess('metar', 'live', metar.ok ? new Date(metar.data.observationTime) : null, 90, now),
    assess('gtfs-rt-nav', 'live', newestVehicle(rtNav), 10, now),
    assess('gtfs-rt-aut', 'live', newestVehicle(rtAut), 10, now),
    assess('cpsm-meteo', 'live', newestWind, 30, now),
    assess('aisstream', 'live', ais.ships[0] ? new Date(ais.ships[0].lastSeen) : null, 30, now,
      ais.configured ? (ais.ships.length ? undefined : 'nessuna nave ricevuta nell’ultima lettura') : 'AISSTREAM_API_KEY non configurata'),
    assess('campo', 'live', campo.ok ? new Date(campo.fetchedAt) : null, 120, now,
      campo.ok ? undefined : 'API CAMPO non raggiungibile'),
    assess('packet-broker', 'live', lora.ok ? new Date(lora.fetchedAt) : null, 30, now,
      lora.ok ? undefined : 'Packet Broker Mapper non raggiungibile'),
    assess('actv-avvisi', 'live', actvRss.ok ? new Date(actvRss.fetchedAt) : null, 60, now,
      actvRss.ok ? undefined : 'feed degli avvisi ACTV non raggiungibile'),
    assess('comune-ordinanze', 'live', ordinances.ok ? new Date(ordinances.fetchedAt) : null, 120, now,
      ordinances.ok ? undefined : 'elenco delle ordinanze non raggiungibile'),
    assess('opensky', 'live', flights.fetchedAt ? new Date(flights.fetchedAt) : null, 5, now, flights.quotaUntil ? `quota giornaliera esaurita, nuovo tentativo dopo ${flights.quotaUntil}` : flights.ok ? undefined : 'servizio non raggiungibile'),
    assess('open-meteo', 'live', windField.ok ? fromRomeLocal(windField.data.validTime.replace('T', ' ')) : null, 90, now),
    assess('cams-air', 'live', cams.ok && cams.data[0] ? fromRomeLocal(cams.data[0].air.validTime.replace('T', ' ')) : null, 120, now),
    assess('open-meteo-marine', 'live', marine.ok ? fromRomeLocal(marine.data.validTime.replace('T', ' ')) : null, 120, now),
    assess('gtfs-static', 'dataset', new Date(GTFS_INDEX_GENERATED_AT), 8 * DAY, now),
    assess('opere-pubbliche', 'dataset', new Date(OPERE_PUBBLICHE_META.generatedAt), 31 * DAY, now),
    assess('wifi', 'dataset', new Date(WIFI_HOTSPOTS_META.generatedAt), 31 * DAY, now),
    assess('arpav', 'dataset', new Date(ARPAV_AIR_META.generatedAt), 120 * DAY, now),
    assess('osm-cameras', 'dataset', new Date(OSM_SURVEILLANCE_META.generatedAt), 31 * DAY, now),
    assess('osm-dae', 'dataset', new Date(OSM_DAE_META.generatedAt), 31 * DAY, now),
    assess('osm-pharmacies', 'dataset', new Date(OSM_PHARMACIES_META.generatedAt), 31 * DAY, now),
    assess('osm-fountains', 'dataset', new Date(fountainsDataset.metadata.extractedAt), 31 * DAY, now),
    assess('flixbus', 'dataset', new Date(flixbusData.generatedAt), 14 * DAY, now),
    assess('osm-toponyms', 'dataset', new Date(osmToponyms.generatedAt), 31 * DAY, now),
    assess('osm-curiosita', 'dataset', new Date(calliCuriosita.generatedAt), 31 * DAY, now),
    assess('venice-tap-water', 'dataset', new Date(veniceTapWater.metadata.generatedAt), 31 * DAY, now),
    assess('osm-poi', 'dataset', new Date(OSM_POI_META.generatedAt), 31 * DAY, now),
    assess('osm-waterways', 'dataset', new Date(lagoonDataset.generatedAt), 31 * DAY, now),
    assess('osm-walk', 'dataset', new Date(WALK_STATS.generatedAt), 31 * DAY, now),
    assess('osm-boat', 'dataset', new Date(BOAT_STATS.generatedAt), 31 * DAY, now),
    assess('osm-civici', 'dataset', new Date(civiciDataset.generatedAt), 31 * DAY, now),
    assess('osm-parks', 'dataset', new Date(parksDataset.generatedAt), 31 * DAY, now),
    assess('arpav-pollen', 'dataset', new Date(pollenDataset.generatedAt), 400 * DAY, now),
    assess('cciaa-turismo', 'dataset', new Date(tourismDataset.generatedAt), 400 * DAY, now),
    assess('arpav-lagoon', 'dataset', new Date(lagoonProbeDataset.generatedAt), 120 * DAY, now),
    // Censimento 2021: la pipeline va rilanciata quando ISTAT pubblica una nuova edizione per sezione
    assess('istat-census', 'dataset', new Date(censusDataset.generatedAt), 1500 * DAY, now),
    assess('cruscotto-italia', 'dataset', new Date(cruscottoDataset.generatedAt), 31 * DAY, now),
    assess('bdap-mop', 'dataset', new Date(bdapDataset.generatedAt), 31 * DAY, now),
    assess('agcom-fiber', 'dataset', new Date(fiberDataset.generatedAt), 120 * DAY, now),
    // il Ministero pubblica ogni giorno i prezzi delle 8: oltre 3 giorni il dato è fermo
    assess('mimit-carburanti', 'dataset', fuel.ok && fuel.data ? fromRomeLocal(`${fuel.data} 08:00:00`) : null, 3 * DAY, now,
      fuel.ok ? undefined : 'fonte non raggiungibile o senza data'),
    assess('alilaguna-gtfs', 'dataset', new Date(ALILAGUNA_FEED_META.generatedAt), 31 * DAY, now,
      isAlilagunaTimetableValid(now) ? undefined : 'orario importato non più valido'),
  ];

  const status = sources.some((s) => s.status === 'down') ? 'degraded' : sources.some((s) => s.status === 'stale') ? 'stale' : 'ok';
  return NextResponse.json({ status, checkedAt: now.toISOString(), sources });
}
