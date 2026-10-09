/**
 * VOD - Venice Open Data
 * Dataset di riferimento e calcoli spaziali in memoria.
 *
 * Nota: l'applicazione web non è collegata a PostgreSQL/PostGIS. Le opere pubbliche arrivano dal
 * portale del Comune tramite pipeline; le fermate sono una selezione statica del GTFS ACTV.
 */

import { CantiereItem, StopItem, StopNearCantiere, PlatformMetrics, isLocated } from './types';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import operePubbliche from '@/data/opere-pubbliche.json';
import fountainsDataset from '@/data/fountains.json';
import { WIFI_HOTSPOTS_DATA, BATHING_WATERS_DATA } from './urbanAssetsVeniceData';
import { OPEN_EV_CHARGING } from './osmPoi';
import { BRICCOLE_SIGNALS_DATA, OCEAN_STATIONS_DATA } from './marineSensorsData';
import { ALILAGUNA_ROUTES, ALILAGUNA_STOPS } from './alilaguna-schedule';
import { OPEN_VERITAS_WASTE_BOATS } from './open-data-catalog';
import { SATELLITES_DATA } from './satellitesData';
import { ARPAV_AIR_STATIONS } from './airQuality';

const averageOf = (values: (number | null)[]): number | null => {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
import { calculateDistanceMeters } from './geo';

/**
 * Opere pubbliche dall'Elenco Annuale dei Lavori 2026 del Comune di Venezia (dati.venezia.it, CC BY),
 * generate da pipeline/import_opere_pubbliche.py. Solo una parte ha una posizione (geocodifica approssimata).
 */
export const OPERE_PUBBLICHE_META = {
  generatedAt: operePubbliche.generatedAt,
  source: operePubbliche.source,
  sourceUrl: operePubbliche.sourceUrl,
  license: operePubbliche.license,
  geocoding: operePubbliche.geocoding,
  count: operePubbliche.count,
  located: operePubbliche.located,
};
export const CANTIERI_REFERENCE: CantiereItem[] = operePubbliche.works as CantiereItem[];

export { ACTV_STOPS_REFERENCE };

export async function fetchCantieri(): Promise<CantiereItem[]> {
  return CANTIERI_REFERENCE;
}

export async function fetchStops(): Promise<StopItem[]> {
  return ACTV_STOPS_REFERENCE;
}

export { calculateDistanceMeters };

export async function findStopsNearCantieri(radiusMeters = 200): Promise<StopNearCantiere[]> {
  const results: StopNearCantiere[] = [];
  const located = CANTIERI_REFERENCE.filter(isLocated);
  for (const stop of ACTV_STOPS_REFERENCE) {
    for (const cantiere of located) {
      const dist = calculateDistanceMeters(stop.lat, stop.lon, cantiere.lat, cantiere.lon);
      if (dist <= radiusMeters) {
        results.push({
          stopId: stop.id,
          stopName: stop.name,
          transportMode: stop.mode,
          stopLat: stop.lat,
          stopLon: stop.lon,
          cantiereId: cantiere.id,
          cantiereTitolo: cantiere.titolo,
          cantiereTipologia: cantiere.tipologia,
          cantiereCategoria: cantiere.categoria,
          distanzaMetri: dist
        });
      }
    }
  }

  results.sort((a, b) => a.distanzaMetri - b.distanzaMetri);
  return results;
}

export interface PlatformMetricsInputs {
  /** Linee e corse dal GTFS ACTV pre-elaborato */
  routesNavigazione: number;
  routesAutomobilistico: number;
  weekdayTrips: number;
  alilagunaBoatsNow: number;
  /** navi AIS note all'istanza (null se il feed non è configurato o non ancora letto) */
  shipsCount: number | null;
  /** Marea reale a Punta Salute (null se la fonte non risponde) */
  tideLevelCm: number | null;
  /** Aerei rilevati da OpenSky (null se la fonte non risponde) */
  activeFlightsCount: number | null;
  satellitesCount: number;
  passerelleTotalMeters: number;
  passerelleMountedCount: number;
  /** Stazioni CPSM con misura di livello nel file corrente (null se la fonte non risponde) */
  cpsmStationsCount: number | null;
  /** Piattaforma "Acqua Alta": misure CPSM correnti (null se non disponibili) */
  cnrWaveHeightMeters: number | null;
  cnrWaterTempC: number | null;
}

/**
 * Indicatori aggregati della piattaforma.
 * I conteggi derivano dai dataset inclusi nel progetto; i valori senza una fonte sono null
 * (mostrati come "n.d."), mai numeri scritti a mano.
 */
export async function fetchPlatformMetrics(inputs: PlatformMetricsInputs): Promise<PlatformMetrics> {
  const cantieri = await fetchCantieri();
  const stops = await fetchStops();
  const near = await findStopsNearCantieri(200);
  const totalInv = cantieri.reduce((acc, c) => acc + (c.importoLavori || 0), 0);

  return {
    // Trasporto pubblico ACTV (GTFS ufficiale)
    totalRoutes: inputs.routesNavigazione + inputs.routesAutomobilistico,
    routesNavigazione: inputs.routesNavigazione,
    routesAutomobilistico: inputs.routesAutomobilistico,
    totalStops: stops.length,
    totalTrips: inputs.weekdayTrips,
    activeVehiclesInService: null,

    // Alilaguna (simulazione da orario)
    alilagunaRoutesCount: ALILAGUNA_ROUTES.length,
    alilagunaStopsCount: ALILAGUNA_STOPS.length,
    alilagunaBoatsCount: inputs.alilagunaBoatsNow,

    // Maree & MOSE (CPSM)
    tideLevelCm: inputs.tideLevelCm,
    moseStatus: null,
    moseGatesCount: 78, // 78 paratoie in 4 schiere alle 3 bocche di porto (Consorzio Venezia Nuova)
    cpsmStationsCount: inputs.cpsmStationsCount,
    floodingPercentage: null,

    // Qualità dell'aria: nessun feed ARPAV collegato
    airStationsCount: ARPAV_AIR_STATIONS.length,
    averageAqi: null,
    averagePm10: averageOf(ARPAV_AIR_STATIONS.map((a) => a.pm10)),
    averageNo2: averageOf(ARPAV_AIR_STATIONS.map((a) => a.no2)),
    airQualityStatus: null,

    // Traffico marittimo (anagrafica banchine)
    activeShipsCount: inputs.shipsCount,
    maritimeChannelsCount: null,
    restrictedLagoonVesselsCount: null,

    // Voli (OpenSky)
    activeFlightsCount: inputs.activeFlightsCount,
    vceDailyMovements: null,
    averageFlightAltitudeMeters: 0,

    // Flussi pedonali: la Smart Control Room non pubblica conteggi aperti
    pedestrianSensorsCount: null,
    totalHourlyPedestrians: null,
    peakPedestrianSensor: null,

    // Parcheggi: nessuna API pubblica di disponibilità posti
    totalParkingSpaces: null,
    freeParkingSpots: null,
    parkingOccupancyRate: null,

    // Satelliti
    activeSatellitesCount: inputs.satellitesCount,
    copernicusSentinelsCount: SATELLITES_DATA.filter((s) => /sentinel/i.test(s.name)).length,
    radarEarthObservationSwathKm: 250, // larghezza di ripresa Sentinel-1 in modalità IW (ESA)
    nextOrbitalPassMinutes: null,

    // Patrimonio & opere pubbliche
    activeCantieri: cantieri.filter(isLocated).length,
    totalInvestmentCantieri: totalInv,
    occupazioniAttive: null,
    stopsNearWorksites200m: near.length,
    drinkingFountainsCount: fountainsDataset.data.length,
    accessibleBridgesCount: null, // manca un elenco aperto dei ponti attrezzati
    veritasServicePointsCount: OPEN_VERITAS_WASTE_BOATS.length,

    // Laguna, ambiente & servizi
    passerelleTotalMeters: inputs.passerelleTotalMeters,
    passerelleMountedCount: inputs.passerelleMountedCount,
    briccoleCount: BRICCOLE_SIGNALS_DATA.length,
    marineLightsCount: null,
    oceanStationsCount: OCEAN_STATIONS_DATA.length,
    cnrWaveHeightMeters: inputs.cnrWaveHeightMeters,
    cnrWaterTempC: inputs.cnrWaterTempC,
    bathingWaterStationsCount: BATHING_WATERS_DATA.length,
    monumentalTreesCount: null,
    evChargingStationsCount: OPEN_EV_CHARGING.length,
    wifiHotspotsCount: WIFI_HOTSPOTS_DATA.length
  };
}
