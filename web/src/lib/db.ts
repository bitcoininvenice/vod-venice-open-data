/**
 * VOD - Venice Open Data
 * Dataset di riferimento e calcoli spaziali in memoria.
 *
 * Nota: l'applicazione web non è collegata a PostgreSQL/PostGIS. Le opere pubbliche arrivano dal
 * portale del Comune tramite pipeline; le fermate sono una selezione statica del GTFS ACTV.
 */

import { CantiereItem, StopItem, StopNearCantiere, PlatformMetrics, isLocated } from './types';
import operePubbliche from '@/data/opere-pubbliche.json';
import fountainsDataset from '@/data/fountains.json';
import { WIFI_HOTSPOTS_DATA } from './urbanAssetsVeniceData';
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

/**
 * Selezione dei principali approdi e fermate ACTV (sottoinsieme del GTFS ufficiale,
 * che conta circa 150 fermate di navigazione e oltre 2.000 automobilistiche).
 */
export const ACTV_STOPS_REFERENCE: StopItem[] = [
  // 1. Canal Grande (da Piazzale Roma a San Marco)
  { id: "P_ROMA_PARISI", name: "P.le Roma (Parisi) 'C/D'", lat: 45.4385, lon: 12.3175, mode: "navigazione", lines: ["1", "2", "3", "4.1", "4.2", "5.1", "5.2", "N"], wheelchair: true },
  { id: "P_ROMA_S_CHIARA", name: "P.le Roma (S. Chiara) 'E/F'", lat: 45.4380, lon: 12.3180, mode: "navigazione", lines: ["1", "2"], wheelchair: true },
  { id: "FERROVIA_SCALZI", name: "Ferrovia (Scalzi) 'A/B'", lat: 45.4411, lon: 12.3210, mode: "navigazione", lines: ["1", "2", "3", "4.1", "4.2", "5.1", "5.2", "N"], wheelchair: true },
  { id: "FERROVIA_S_LUCIA", name: "Ferrovia (S. Lucia) 'C/D/E'", lat: 45.4415, lon: 12.3225, mode: "navigazione", lines: ["1", "2", "3", "N"], wheelchair: true },
  { id: "RIVA_DE_BIASIO", name: "Riva de Biasio", lat: 45.4422, lon: 12.3255, mode: "navigazione", lines: ["1", "5.1", "5.2", "N"], wheelchair: true },
  { id: "S_MARCUOLA", name: "S. Marcuola (Casinò)", lat: 45.4428, lon: 12.3290, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_STAE", name: "S. Stae", lat: 45.4416, lon: 12.3308, mode: "navigazione", lines: ["1", "N"], wheelchair: true },
  { id: "CA_DORO", name: "Ca' d'Oro", lat: 45.4406, lon: 12.3340, mode: "navigazione", lines: ["1", "N"], wheelchair: false },
  { id: "RIALTO_MERCATO", name: "Rialto Mercato", lat: 45.4392, lon: 12.3352, mode: "navigazione", lines: ["1", "N"], wheelchair: true },
  { id: "RIALTO", name: "Rialto 'C/D'", lat: 45.4379, lon: 12.3358, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_SILVESTRO", name: "S. Silvestro", lat: 45.4365, lon: 12.3342, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "S_TOMA", name: "S. Tomà", lat: 45.4357, lon: 12.3288, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_ANGELO", name: "S. Angelo", lat: 45.4350, lon: 12.3305, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "S_SAMUELE", name: "S. Samuele (Palazzo Grassi)", lat: 45.4332, lon: 12.3282, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "CA_REZZONICO", name: "Ca' Rezzonico", lat: 45.4328, lon: 12.3270, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "ACCADEMIA", name: "Accademia", lat: 45.4312, lon: 12.3288, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_MARIA_GIGLIO", name: "S. Maria del Giglio", lat: 45.4316, lon: 12.3325, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "SALUTE", name: "Salute", lat: 45.4310, lon: 12.3355, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "SM_VAL", name: "S. Marco Vallaresso", lat: 45.4325, lon: 12.3375, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "SM_GIARDINETTI", name: "S. Marco Giardinetti", lat: 45.4328, lon: 12.3388, mode: "navigazione", lines: ["2"], wheelchair: true },

  // 2. Bacino San Marco, Riva degli Schiavoni, Castello & Sant'Elena
  { id: "SZ-A", name: "S. Zaccaria (Pietà) 'A'", lat: 45.4342, lon: 12.3448, mode: "navigazione", lines: ["14", "15", "B"], wheelchair: true },
  { id: "SZ-B", name: "S. Zaccaria (Danieli) 'B'", lat: 45.4339, lon: 12.3432, mode: "navigazione", lines: ["1", "5.1", "5.2", "N"], wheelchair: true },
  { id: "SZ-C", name: "S. Zaccaria (Jolanda) 'C'", lat: 45.4336, lon: 12.3421, mode: "navigazione", lines: ["2", "4.1", "4.2"], wheelchair: true },
  { id: "SZ-E", name: "S. Zaccaria (Monumento) 'E/F'", lat: 45.4338, lon: 12.3412, mode: "navigazione", lines: ["2", "N"], wheelchair: true },
  { id: "ARSENALE", name: "Arsenale", lat: 45.4335, lon: 12.3488, mode: "navigazione", lines: ["1", "4.1", "4.2"], wheelchair: true },
  { id: "GIARDINI", name: "Giardini 'A/B'", lat: 45.4300, lon: 12.3562, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2", "6", "8", "N"], wheelchair: true },
  { id: "GIARDINI_BIENNALE", name: "Giardini Biennale", lat: 45.4288, lon: 12.3585, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "S_ELENA", name: "S. Elena", lat: 45.4270, lon: 12.3645, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2", "6"], wheelchair: true },

  // 3. Canale della Giudecca, Dorsoduro & Tronchetto
  { id: "TRONCHETTO", name: "Tronchetto Ferry", lat: 45.4422, lon: 12.3048, mode: "ferry", lines: ["17"], wheelchair: true },
  { id: "TRONCHETTO_NAV", name: "Tronchetto 'A/B'", lat: 45.4418, lon: 12.3055, mode: "navigazione", lines: ["2", "N"], wheelchair: true },
  { id: "TRONCHETTO_MERCATO", name: "Tronchetto Mercato", lat: 45.4410, lon: 12.3082, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "S_BASILIO", name: "S. Basilio", lat: 45.4335, lon: 12.3195, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "ZATTERE", name: "Zattere (Gesuati)", lat: 45.4295, lon: 12.3275, mode: "navigazione", lines: ["2", "5.1", "5.2", "6", "10", "16"], wheelchair: true },
  { id: "SPIRITO_SANTO", name: "Spirito Santo", lat: 45.4298, lon: 12.3330, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "SACCA_FISOLA", name: "Sacca Fisola", lat: 45.4285, lon: 12.3120, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "PALANCA", name: "Giudecca Palanca", lat: 45.4265, lon: 12.3218, mode: "navigazione", lines: ["2", "4.1", "4.2", "8", "N"], wheelchair: true },
  { id: "REDENTORE", name: "Redentore", lat: 45.4258, lon: 12.3315, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "ZITELLE", name: "Zitelle", lat: 45.4262, lon: 12.3415, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "S_GIORGIO", name: "S. Giorgio Maggiore", lat: 45.4292, lon: 12.3435, mode: "navigazione", lines: ["2", "N"], wheelchair: true },

  // 4. Canale di Cannaregio & Canale delle Navi
  { id: "TRE_ARCHI", name: "Tre Archi", lat: 45.4452, lon: 12.3182, mode: "navigazione", lines: ["4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "GUGLIE", name: "Ponte delle Guglie", lat: 45.4435, lon: 12.3248, mode: "navigazione", lines: ["4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "CREA", name: "Crea", lat: 45.4468, lon: 12.3142, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 5. Fondamente Nove & Cimitero
  { id: "F_NOVE", name: "F.te Nove 'A'", lat: 45.4452, lon: 12.3420, mode: "navigazione", lines: ["4.1", "4.2", "12", "13", "22"], wheelchair: true },
  { id: "F_NOVE_B", name: "F.te Nove 'B/C'", lat: 45.4450, lon: 12.3408, mode: "navigazione", lines: ["4.1", "4.2", "12"], wheelchair: true },
  { id: "F_NOVE_D", name: "F.te Nove 'D'", lat: 45.4445, lon: 12.3392, mode: "navigazione", lines: ["5.1", "5.2", "A"], wheelchair: true },
  { id: "CIMITERO", name: "Cimitero S. Michele", lat: 45.4485, lon: 12.3468, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 6. Murano (Rete pontili dell'isola del vetro)
  { id: "MURANO_COL", name: "Murano Colonna 'A'", lat: 45.4518, lon: 12.3525, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "18"], wheelchair: true },
  { id: "MURANO_FARO", name: "Murano Faro", lat: 45.4535, lon: 12.3562, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "12", "N"], wheelchair: true },
  { id: "MURANO_NAVAGERO", name: "Murano Navagero", lat: 45.4568, lon: 12.3582, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "18"], wheelchair: true },
  { id: "MURANO_MUSEO", name: "Murano Museo", lat: 45.4582, lon: 12.3552, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_DA_MULA", name: "Murano Da Mula", lat: 45.4572, lon: 12.3522, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_VENIER", name: "Murano Venier", lat: 45.4562, lon: 12.3485, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_SERENELLA", name: "Murano Serenella", lat: 45.4532, lon: 12.3468, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 7. Laguna Nord (Vignole, Sant'Erasmo, Mazzorbo, Burano, Torcello, Treporti, Punta Sabbioni)
  { id: "VIGNOLE", name: "Vignole", lat: 45.4428, lon: 12.3780, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_CAPANNONE", name: "S. Erasmo Capannone", lat: 45.4520, lon: 12.3940, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_CHIESA", name: "S. Erasmo Chiesa", lat: 45.4610, lon: 12.4110, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_PUNTA_VELA", name: "S. Erasmo Punta Vela", lat: 45.4745, lon: 12.4285, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "LAZZARETTO_NUOVO", name: "Lazzaretto Nuovo", lat: 45.4560, lon: 12.3860, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "MAZZORBO", name: "Mazzorbo", lat: 45.4862, lon: 12.4095, mode: "navigazione", lines: ["12", "NLN"], wheelchair: true },
  { id: "BURANO", name: "Burano 'B'", lat: 45.4855, lon: 12.4168, mode: "navigazione", lines: ["9", "12", "NLN"], wheelchair: true },
  { id: "TORCELLO", name: "Torcello", lat: 45.4965, lon: 12.4182, mode: "navigazione", lines: ["9", "12"], wheelchair: true },
  { id: "TREPORTI", name: "Treporti", lat: 45.4835, lon: 12.4510, mode: "navigazione", lines: ["12", "13", "NLN"], wheelchair: true },
  { id: "PUNTA_SABBIONI", name: "Punta Sabbioni", lat: 45.4485, lon: 12.4248, mode: "navigazione", lines: ["12", "14", "15", "17", "22", "NLN"], wheelchair: true },

  // 8. Lido di Venezia, Certosa & Laguna Sud
  { id: "CERTOSA", name: "Certosa", lat: 45.4315, lon: 12.3685, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },
  { id: "LIDO_SME", name: "Lido S.M.E. 'D'", lat: 45.4170, lon: 12.3690, mode: "navigazione", lines: ["1", "5.1", "5.2", "6", "10", "14", "N"], wheelchair: true },
  { id: "LIDO_SME_A", name: "Lido S.M.E. 'A/B'", lat: 45.4175, lon: 12.3685, mode: "navigazione", lines: ["1", "2"], wheelchair: true },
  { id: "LIDO_SAN_NICOLO_FERRY", name: "Lido S. Nicolò (Ferry Linea 17)", lat: 45.4285, lon: 12.3810, mode: "ferry", lines: ["17"], wheelchair: true },
  { id: "LIDO_CASINO", name: "Lido Casinò", lat: 45.4055, lon: 12.3695, mode: "navigazione", lines: ["20"], wheelchair: true },
  { id: "ALBERONI_ROCCHETTA", name: "Alberoni Rocchetta", lat: 45.3465, lon: 12.3160, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "SANTA_MARIA_MARE", name: "S. Maria del Mare (Ferry Linea 11)", lat: 45.3410, lon: 12.3090, mode: "ferry", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_PORTOSECCO", name: "Pellestrina Portosecco", lat: 45.3120, lon: 12.3025, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_CHIESA", name: "Pellestrina (S. Antonio)", lat: 45.2750, lon: 12.2980, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_CIMITERO", name: "Pellestrina Cimitero", lat: 45.2650, lon: 12.2960, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "CAROMAN", name: "Caroman", lat: 45.2410, lon: 12.2940, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "CHIOGGIA_VIGO", name: "Chioggia (Piazzetta Vigo)", lat: 45.2210, lon: 12.2820, mode: "navigazione", lines: ["11"], wheelchair: true },

  // 9. Terraferma Interscambio & Hub Terrestri
  { id: "FUSINA", name: "Fusina", lat: 45.4190, lon: 12.2575, mode: "navigazione", lines: ["16"], wheelchair: true },
  { id: "SAN_GIULIANO", name: "S. Giuliano", lat: 45.4665, lon: 12.2785, mode: "navigazione", lines: ["AL"], wheelchair: true },
  { id: "P_ROMA_BUS", name: "P.le Roma (Corsia A1)", lat: 45.4382, lon: 12.3188, mode: "bus", lines: ["2", "4L", "6", "7", "80"], wheelchair: true },
  { id: "P_ROMA_TRAM", name: "P.le Roma (Capolinea Tram)", lat: 45.4377, lon: 12.3195, mode: "tram", lines: ["T1"], wheelchair: true },
  { id: "LIDO_BUS", name: "Lido S.M.E. (Piazza)", lat: 45.4168, lon: 12.3682, mode: "bus", lines: ["11", "A", "B", "C", "V"], wheelchair: true },
  { id: "MESTRE_CENTRO", name: "Mestre Centro (P.le Cialdini)", lat: 45.4925, lon: 12.2405, mode: "tram", lines: ["T1", "T2", "4L", "2"], wheelchair: true },
  { id: "MESTRE_FS", name: "Mestre Stazione F.S.", lat: 45.4820, lon: 12.2315, mode: "bus", lines: ["2", "9", "15", "31H"], wheelchair: true }
];

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
  shipsCount: number;
  shipsGrossTonnage: number;
  /** Marea reale a Punta Salute (null se la fonte non risponde) */
  tideLevelCm: number | null;
  /** Aerei rilevati da OpenSky (null se la fonte non risponde) */
  activeFlightsCount: number | null;
  satellitesCount: number;
  passerelleTotalMeters: number;
  passerelleMountedCount: number;
  /** Piattaforma "Acqua Alta": misure CPSM correnti (null se non disponibili) */
  cnrWaveHeightMeters: number | null;
  cnrWaterTempC: number | null;
}

/**
 * Indicatori aggregati della piattaforma.
 * I conteggi derivano dai dataset inclusi nel progetto; le misure senza fonte in tempo reale sono null.
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
    alilagunaRoutesCount: 4,
    alilagunaStopsCount: 21,
    alilagunaBoatsCount: inputs.alilagunaBoatsNow,

    // Maree & MOSE (CPSM)
    tideLevelCm: inputs.tideLevelCm,
    moseStatus: null,
    moseGatesCount: 78,
    cpsmStationsCount: 14,
    floodingPercentage: null,

    // Qualità dell'aria: nessun feed ARPAV collegato
    airStationsCount: ARPAV_AIR_STATIONS.length,
    averageAqi: null,
    averagePm10: averageOf(ARPAV_AIR_STATIONS.map((a) => a.pm10)),
    averageNo2: averageOf(ARPAV_AIR_STATIONS.map((a) => a.no2)),
    airQualityStatus: null,

    // Traffico marittimo (anagrafica banchine)
    activeShipsCount: inputs.shipsCount,
    totalGrossTonnage: inputs.shipsGrossTonnage,
    maritimeChannelsCount: 4,
    restrictedLagoonVesselsCount: 4,

    // Voli (OpenSky)
    activeFlightsCount: inputs.activeFlightsCount,
    vceDailyMovements: null,
    averageFlightAltitudeMeters: 0,

    // Flussi pedonali: la Smart Control Room non pubblica conteggi aperti
    pedestrianSensorsCount: 8,
    totalHourlyPedestrians: null,
    peakPedestrianSensor: null,

    // Parcheggi: nessuna API pubblica di disponibilità posti
    totalParkingSpaces: 10149,
    freeParkingSpots: null,
    parkingOccupancyRate: null,

    // Satelliti
    activeSatellitesCount: inputs.satellitesCount,
    copernicusSentinelsCount: 2,
    radarEarthObservationSwathKm: 250,
    nextOrbitalPassMinutes: null,

    // Patrimonio & opere pubbliche
    activeCantieri: cantieri.filter(isLocated).length,
    totalInvestmentCantieri: totalInv,
    occupazioniAttive: 14,
    stopsNearWorksites200m: near.length,
    drinkingFountainsCount: fountainsDataset.data.length,
    accessibleBridgesCount: 48,
    veritasServicePointsCount: 18,

    // Laguna, ambiente & servizi
    passerelleTotalMeters: inputs.passerelleTotalMeters,
    passerelleMountedCount: inputs.passerelleMountedCount,
    briccoleCount: 8,
    marineLightsCount: 5,
    oceanStationsCount: 4,
    cnrWaveHeightMeters: inputs.cnrWaveHeightMeters,
    cnrWaterTempC: inputs.cnrWaterTempC,
    bathingWaterStationsCount: 5,
    monumentalTreesCount: 6,
    evChargingStationsCount: 4,
    wifiHotspotsCount: WIFI_HOTSPOTS_DATA.length
  };
}
