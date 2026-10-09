import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { assess, fromRomeLocal, type SourceHealth } from '@/server/sourceHealth';
import { REFERENCE_STATION_ID, TIDE_FORECAST_URL, TIDE_LEVELS_URL, parseTideForecast, parseTideLevels } from '@/server/sources/tide';
import { LIPZ_METAR_URL, parseLipzMetar } from '@/server/sources/metar';
import { ACTV_GTFS_RT_FEEDS, parseVehiclePositions } from '@/server/sources/gtfsRt';
import { CPSM_METEO_URLS, parseCpsmFeed } from '@/server/sources/cpsmMeteo';
import { OPENSKY_STATES_URL, parseOpenSkyStates } from '@/server/sources/opensky';
import { getShipsSnapshot } from '@/server/sources/aisstream';
import { PACKET_BROKER_URL, parseGateways } from '@/server/sources/packetBroker';
import { CAMPO_API_URL, parseCampo } from '@/server/sources/campo';
import { openMeteoWindUrl, parseOpenMeteoWind } from '@/server/sources/openMeteoWind';
import { airQualityUrl, parseAirQuality } from '@/server/sources/openMeteoAir';
import { marineUrl, parseMarine } from '@/server/sources/openMeteoMarine';
import { ARPAV_AIR_STATIONS } from '@/lib/airQuality';
import { OCEAN_STATIONS_DATA } from '@/lib/marineSensorsData';
import { GTFS_INDEX_GENERATED_AT } from '@/server/sources/gtfsIndex';
import { OPERE_PUBBLICHE_META } from '@/lib/db';
import { WIFI_HOTSPOTS_META } from '@/lib/urbanAssetsVeniceData';
import { ARPAV_AIR_META } from '@/lib/airQuality';
import { OSM_SURVEILLANCE_META } from '@/lib/cameras-data';
import { OSM_DAE_META } from '@/lib/dae-data';
import { OSM_PHARMACIES_META } from '@/lib/pharmacies-data';
import fountainsDataset from '@/data/fountains.json';
import { OSM_POI_META } from '@/lib/osmPoi';
import { ALILAGUNA_FEED_META, isAlilagunaTimetableValid } from '@/lib/alilaguna-schedule';
import fiberDataset from '@/data/agcom-fiber.json';
import lagoonDataset from '@/data/osm-waterways.json';
import pollenDataset from '@/data/arpav-pollen-venezia.json';
import tourismDataset from '@/data/turismo-comuni.json';
import lagoonProbeDataset from '@/data/arpav-lagoon.json';
import cruscottoDataset from '@/data/cruscotto-comuni.json';
import bdapDataset from '@/data/bdap-opere-venezia.json';

export const revalidate = 60;

const DAY = 24 * 60;
const ACQUA_ALTA = OCEAN_STATIONS_DATA.find((s) => s.id === 'CNR-PLAT-01') ?? { lat: 45.3231, lon: 12.5147 };

/**
 * Stato delle fonti: per i dati live l'età dell'ultima misura, per i dataset generati dalla
 * pipeline la data di generazione. Usabile da un monitor esterno (es. uptime check su "status").
 */
export async function GET() {
  const now = new Date();
  const [levels, forecast, metar, rtNav, rtAut, wind, flights, windField, cams, marine, ais, lora, campo] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 60 }),
    fetchUpstream(TIDE_FORECAST_URL, (raw) => parseTideForecast(raw, now), { revalidate: 600 }),
    fetchUpstream(LIPZ_METAR_URL, parseLipzMetar, { revalidate: 300 }),
    fetchUpstream(ACTV_GTFS_RT_FEEDS.navigazione, (raw) => parseVehiclePositions(raw as ArrayBuffer), { revalidate: 20, responseType: 'arrayBuffer' }),
    fetchUpstream(ACTV_GTFS_RT_FEEDS.automobilistico, (raw) => parseVehiclePositions(raw as ArrayBuffer), { revalidate: 20, responseType: 'arrayBuffer' }),
    fetchUpstream(CPSM_METEO_URLS.vento, parseCpsmFeed, { revalidate: 300 }),
    fetchUpstream(OPENSKY_STATES_URL, parseOpenSkyStates, { revalidate: 15 }),
    fetchUpstream(openMeteoWindUrl(), parseOpenMeteoWind, { revalidate: 1800, timeoutMs: 8000 }),
    fetchUpstream(airQualityUrl(ARPAV_AIR_STATIONS), parseAirQuality, { revalidate: 1800, timeoutMs: 8000 }),
    fetchUpstream(marineUrl(ACQUA_ALTA.lat, ACQUA_ALTA.lon), parseMarine, { revalidate: 1800, timeoutMs: 8000 }),
    getShipsSnapshot(5_000),
    fetchUpstream(PACKET_BROKER_URL, parseGateways, { revalidate: 600, timeoutMs: 8000 }),
    fetchUpstream(CAMPO_API_URL, parseCampo, { revalidate: 3600, timeoutMs: 8000 }),
  ]);

  const newestVehicle = (r: typeof rtNav) =>
    r.ok && r.data.length > 0 ? new Date(Math.max(...r.data.map((v) => (v.timestamp ?? 0) * 1000))) : null;
  const newestWind = wind.ok
    ? wind.data.map((r) => fromRomeLocal(r.observedAt)).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null
    : null;
  const reference = levels.ok ? levels.data.find((s) => s.id === REFERENCE_STATION_ID) : undefined;

  const sources: SourceHealth[] = [
    assess('tide', 'Marea CPSM (livello.json)', 'live', fromRomeLocal(reference?.observedAt), 30, now),
    assess('tide-forecast', 'Previsione marea CPSM (previsione.json)', 'live', forecast.ok ? fromRomeLocal(forecast.data?.issuedAt) : null, DAY, now,
      'emissione dell\'ultima previsione'),
    assess('metar', 'METAR LIPZ (NOAA AWC)', 'live', metar.ok ? new Date(metar.data.observationTime) : null, 90, now),
    assess('gtfs-rt-nav', 'GTFS-RT ACTV navigazione', 'live', newestVehicle(rtNav), 10, now),
    assess('gtfs-rt-aut', 'GTFS-RT ACTV automobilistico', 'live', newestVehicle(rtAut), 10, now),
    assess('cpsm-meteo', 'Rete meteo-marina CPSM', 'live', newestWind, 30, now),
    assess('aisstream', 'Navi AIS (aisstream.io)', 'live', ais.ships[0] ? new Date(ais.ships[0].lastSeen) : null, 30, now,
      ais.configured ? (ais.ships.length ? undefined : 'nessuna nave ricevuta nell’ultima lettura') : 'AISSTREAM_API_KEY non configurata'),
    assess('campo', 'Spazi sportivi CAMPO', 'live', campo.ok ? new Date(campo.fetchedAt) : null, 120, now,
      campo.ok ? undefined : 'API CAMPO non raggiungibile'),
    assess('packet-broker', 'Gateway LoRaWAN (Packet Broker)', 'live', lora.ok ? new Date(lora.fetchedAt) : null, 30, now,
      lora.ok ? undefined : 'Packet Broker Mapper non raggiungibile'),
    assess('opensky', 'OpenSky Network', 'live', flights.ok ? now : null, 5, now, flights.ok ? undefined : 'quota esaurita o servizio non raggiungibile'),
    assess('open-meteo', 'Previsione vento Open-Meteo', 'live', windField.ok ? fromRomeLocal(windField.data.validTime.replace('T', ' ')) : null, 90, now),
    assess('cams-air', 'Previsione aria, pollini e UV Copernicus CAMS', 'live', cams.ok && cams.data[0] ? fromRomeLocal(cams.data[0].air.validTime.replace('T', ' ')) : null, 120, now),
    assess('open-meteo-marine', 'Previsione marina Open-Meteo', 'live', marine.ok ? fromRomeLocal(marine.data.validTime.replace('T', ' ')) : null, 120, now),
    assess('gtfs-static', 'Simulazione GTFS ACTV (pipeline)', 'dataset', new Date(GTFS_INDEX_GENERATED_AT), 8 * DAY, now),
    assess('opere-pubbliche', 'Opere pubbliche (pipeline)', 'dataset', new Date(OPERE_PUBBLICHE_META.generatedAt), 31 * DAY, now),
    assess('wifi', 'Hotspot WiFi (pipeline)', 'dataset', new Date(WIFI_HOTSPOTS_META.generatedAt), 31 * DAY, now),
    assess('arpav', 'Qualità aria ARPAV (pipeline)', 'dataset', new Date(ARPAV_AIR_META.generatedAt), 120 * DAY, now),
    assess('osm-cameras', 'Telecamere OpenStreetMap (pipeline)', 'dataset', new Date(OSM_SURVEILLANCE_META.generatedAt), 31 * DAY, now),
    assess('osm-dae', 'Defibrillatori OpenStreetMap (pipeline)', 'dataset', new Date(OSM_DAE_META.generatedAt), 31 * DAY, now),
    assess('osm-pharmacies', 'Farmacie OpenStreetMap (pipeline)', 'dataset', new Date(OSM_PHARMACIES_META.generatedAt), 31 * DAY, now),
    assess('osm-fountains', 'Fontanelle OpenStreetMap (pipeline)', 'dataset', new Date(fountainsDataset.metadata.extractedAt), 31 * DAY, now),
    assess('osm-poi', 'POI OpenStreetMap: colonnine, parcheggi, pozzi, alberi (pipeline)', 'dataset', new Date(OSM_POI_META.generatedAt), 31 * DAY, now),
    assess('osm-waterways', 'Briccole e canali OpenStreetMap (pipeline)', 'dataset', new Date(lagoonDataset.generatedAt), 31 * DAY, now),
    assess('arpav-pollen', 'Pollini misurati ARPAV Venezia (pipeline)', 'dataset', new Date(pollenDataset.generatedAt), 400 * DAY, now),
    assess('cciaa-turismo', 'Turismo e popolazione dei comuni della laguna (pipeline)', 'dataset', new Date(tourismDataset.generatedAt), 400 * DAY, now),
    assess('arpav-lagoon', 'Sonde ARPAV della laguna e balneazione (pipeline)', 'dataset', new Date(lagoonProbeDataset.generatedAt), 120 * DAY, now),
    assess('cruscotto-italia', 'Profilo dei comuni da Cruscotto Italia (pipeline)', 'dataset', new Date(cruscottoDataset.generatedAt), 31 * DAY, now),
    assess('bdap-mop', 'Opere pubbliche del Comune dal monitoraggio BDAP (pipeline)', 'dataset', new Date(bdapDataset.generatedAt), 31 * DAY, now),
    assess('agcom-fiber', 'Copertura rete fissa AGCOM (pipeline)', 'dataset', new Date(fiberDataset.generatedAt), 120 * DAY, now),
    assess('alilaguna-gtfs', 'Orario Alilaguna GTFS (pipeline)', 'dataset', new Date(ALILAGUNA_FEED_META.generatedAt), 31 * DAY, now,
      isAlilagunaTimetableValid(now) ? undefined : 'orario importato non più valido'),
  ];

  const status = sources.some((s) => s.status === 'down') ? 'degraded' : sources.some((s) => s.status === 'stale') ? 'stale' : 'ok';
  return NextResponse.json({ status, checkedAt: now.toISOString(), sources });
}
