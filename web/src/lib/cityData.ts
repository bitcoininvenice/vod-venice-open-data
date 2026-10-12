/**
 * Dati della mappa in un unico oggetto e registro delle API che li forniscono.
 *
 * Ogni risorsa dichiara URL, come estrarre i campi dalla risposta e, se è un dato live, ogni quanto
 * aggiornarla; `neededResources` decide quali servono in base ai livelli accesi e alle finestre aperte.
 * Il caricamento vero e proprio è in `useCityData`.
 */
import type {
  AirportMetarData, AirQualityItem, CityAirTemperature, AlilagunaRoute, AlilagunaStop, BathingWaterItem, BellTowerItem,
  BriccolaSignalItem, BridgeClearanceItem, CanalSpeedLimitItem, CantiereItem, CityAssetItem, CivicPoiItem,
  EmergencyWaterDockItem, EvChargingItem, FlightItem, GondolaStationItem, HeatIslandSurfaceTempItem,
  LagoonFortressIslandItem, LagoonMorphologyItem, LagoonTributaryRiverItem, LagoonWaterQualityItem, LoraGateway,
  MeteoMarineWindItem, MoseGateItem, NauticalPlace, ParkPlace, NizioletoCivicoItem, OceanStationItem, ParkingItem,
  PasserellaItem, PedestrianFlowItem, PharmacyItem, PollenMonitoringStationItem, PublicDaeItem, PublicDockItem,
  RegionalBikeRouteItem, SatelliteItem, ShipItem, SportPlace, StopItem, SubsidenceInSARItem,
  TouristAccommodationItem, TrainLiveItem, UrbanTreeItem, VeniceCameraItem, VeniceWellItem,
  VeritasWasteBoatItem, WifiHotspotItem, WifiVenue, WindField,
} from './types';
import type { TideCategory, TideForecast, TideResponse, TideStation, TideTrend } from './contracts/tide';
import type { RealtimeVehicleDto } from './contracts/realtime';
import { isLocatedBdap, type BdapProject } from './bdap';
import type { FiberDataset } from './fiber';
import type { LagoonNetwork } from './lagoonNetwork';
import type { LayerVisibility } from './layerState';
import type { LayerKey } from './urlLayers';
import {
  REGIONAL_BIKE_ROUTES, REGIONAL_POLLEN_STATIONS, REGIONAL_TOURIST_ACCOMMODATIONS, REGIONAL_TRIBUTARY_RIVERS,
} from './regionalVenetoData';
import {
  OPEN_BELL_TOWERS, OPEN_BRIDGE_CLEARANCES, OPEN_CANAL_SPEED_LIMITS, OPEN_EMERGENCY_WATER_DOCKS,
  OPEN_GONDOLA_STATIONS, OPEN_HEAT_ISLAND_LST, OPEN_LAGOON_FORTRESS_ISLANDS, OPEN_LAGOON_MORPHOLOGY,
  OPEN_LIVE_TRAINS, OPEN_NIZIOLETI_CIVICI, OPEN_PUBLIC_DOCKS, OPEN_SUBSIDENCE_INSAR, OPEN_VERITAS_WASTE_BOATS,
} from './open-data-catalog';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import { OPEN_PUBLIC_DAE } from './dae-data';
import { OPEN_PHARMACIES } from './pharmacies-data';
import { VENICE_CAMERAS } from './cameras-data';
import { LAGOON_CURRENT_CHANNELS, type LagoonCurrentChannel } from './lagoonCurrents';

export interface TideInfo {
  observedAt: string | null;
  trend: TideTrend | null;
  category: TideCategory | null;
  forecast: TideForecast | null;
}

/** Tutti i dati disegnati sulla mappa o usati da ricerca, esportazione e schede. */
export interface CityData {
  // Marea (sempre caricata: è nell'intestazione)
  tideLevel: number | null;
  tideInfo: TideInfo;
  cpsmStations: TideStation[];
  moseGates: MoseGateItem[];
  // Mobilità
  stops: StopItem[];
  realtimeVehicles: RealtimeVehicleDto[];
  flights: FlightItem[];
  ships: ShipItem[];
  alilagunaRoutes: AlilagunaRoute[];
  alilagunaStops: AlilagunaStop[];
  parkings: ParkingItem[];
  canalSpeedLimits: CanalSpeedLimitItem[];
  bridges: BridgeClearanceItem[];
  gondolas: GondolaStationItem[];
  docks: PublicDockItem[];
  nauticalPlaces: NauticalPlace[];
  liveTrains: TrainLiveItem[];
  wasteBoats: VeritasWasteBoatItem[];
  regionalBikeRoutes: RegionalBikeRouteItem[];
  lagoonNetwork: LagoonNetwork | null;
  // Laguna e ambiente
  passerelle: PasserellaItem[];
  briccole: BriccolaSignalItem[];
  oceanStations: OceanStationItem[];
  bathingWaters: BathingWaterItem[];
  marineWindStations: MeteoMarineWindItem[];
  windField: WindField | null;
  metarData: AirportMetarData | null;
  /** temperatura dell'aria nel centro storico (barra dell'orario) */
  cityTemp: CityAirTemperature | null;
  subsidencePoints: SubsidenceInSARItem[];
  lagoonMorphology: LagoonMorphologyItem[];
  lagoonWaterQuality: LagoonWaterQualityItem[];
  lagoonCurrents: LagoonCurrentChannel[];
  lagoonTributaryRivers: LagoonTributaryRiverItem[];
  airStations: AirQualityItem[];
  pollenMonitoringStations: PollenMonitoringStationItem[];
  trees: UrbanTreeItem[];
  heatIslands: HeatIslandSurfaceTempItem[];
  // Città
  cantieri: CantiereItem[];
  bdapWorks: BdapProject[] | null;
  fountains: CityAssetItem[];
  accessibleBridges: CityAssetItem[];
  veritasServices: CityAssetItem[];
  recyclingCentres: CivicPoiItem[];
  libraries: CivicPoiItem[];
  wifiVenues: WifiVenue[];
  wifiHotspots: WifiHotspotItem[];
  fiberData: FiberDataset | null;
  loraGateways: LoraGateway[];
  evCharging: EvChargingItem[];
  cameras: VeniceCameraItem[];
  pedestrianFlows: PedestrianFlowItem[];
  sportPlaces: SportPlace[];
  parkPlaces: ParkPlace[];
  pharmacies: PharmacyItem[];
  daeList: PublicDaeItem[];
  emergencyDocks: EmergencyWaterDockItem[];
  nizioleti: NizioletoCivicoItem[];
  wells: VeniceWellItem[];
  bellTowers: BellTowerItem[];
  fortressIslands: LagoonFortressIslandItem[];
  satellites: SatelliteItem[];
  touristAccommodations: TouristAccommodationItem[];
}

/** Valori iniziali: elenchi di riferimento inclusi nella build, poi sostituiti dalle API. */
export const INITIAL_CITY_DATA: CityData = {
  tideLevel: null,
  tideInfo: { observedAt: null, trend: null, category: null, forecast: null },
  cpsmStations: [],
  moseGates: [],
  stops: ACTV_STOPS_REFERENCE,
  realtimeVehicles: [],
  flights: [],
  ships: [],
  alilagunaRoutes: [],
  alilagunaStops: [],
  parkings: [],
  canalSpeedLimits: OPEN_CANAL_SPEED_LIMITS,
  bridges: OPEN_BRIDGE_CLEARANCES,
  gondolas: OPEN_GONDOLA_STATIONS,
  docks: OPEN_PUBLIC_DOCKS,
  nauticalPlaces: [],
  liveTrains: OPEN_LIVE_TRAINS,
  wasteBoats: OPEN_VERITAS_WASTE_BOATS,
  regionalBikeRoutes: REGIONAL_BIKE_ROUTES,
  lagoonNetwork: null,
  lagoonCurrents: LAGOON_CURRENT_CHANNELS,
  passerelle: [],
  briccole: [],
  oceanStations: [],
  bathingWaters: [],
  marineWindStations: [],
  windField: null,
  metarData: null,
  cityTemp: null,
  subsidencePoints: OPEN_SUBSIDENCE_INSAR,
  lagoonMorphology: OPEN_LAGOON_MORPHOLOGY,
  lagoonWaterQuality: [],
  lagoonTributaryRivers: REGIONAL_TRIBUTARY_RIVERS,
  airStations: [],
  pollenMonitoringStations: REGIONAL_POLLEN_STATIONS,
  trees: [],
  heatIslands: OPEN_HEAT_ISLAND_LST,
  cantieri: [],
  bdapWorks: null,
  fountains: [],
  accessibleBridges: [],
  veritasServices: [],
  recyclingCentres: [],
  libraries: [],
  wifiVenues: [],
  wifiHotspots: [],
  fiberData: null,
  loraGateways: [],
  evCharging: [],
  cameras: VENICE_CAMERAS,
  pedestrianFlows: [],
  sportPlaces: [],
  parkPlaces: [],
  pharmacies: OPEN_PHARMACIES,
  daeList: OPEN_PUBLIC_DAE,
  emergencyDocks: OPEN_EMERGENCY_WATER_DOCKS,
  nizioleti: OPEN_NIZIOLETI_CIVICI,
  wells: [],
  bellTowers: OPEN_BELL_TOWERS,
  fortressIslands: OPEN_LAGOON_FORTRESS_ISLANDS,
  satellites: [],
  touristAccommodations: REGIONAL_TOURIST_ACCOMMODATIONS,
};

// ---------------------------------------------------------------------------
// Registro delle API
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
type Patch = Partial<CityData>;

/** Elenco presente nella risposta, altrimenti undefined (il campo resta com'era). */
function list<T>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : undefined;
}
/** Come `list`, ma un elenco vuoto non sostituisce i dati di riferimento della build. */
function nonEmpty<T>(value: unknown): T[] | undefined {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : undefined;
}
function obj(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined;
}
/** `data` delle risposte `{ success, data }`, solo se la richiesta è riuscita. */
function payload(json: Json): Json | undefined {
  return json.success ? obj(json.data) : undefined;
}

export interface ResourceSpec {
  url: string;
  /** Campi di CityData ricavati dalla risposta (i campi undefined non cambiano). */
  pick: (json: Json) => Patch | undefined;
  /** Dati live: intervallo di aggiornamento finché la risorsa serve. Senza, si carica una volta. */
  refreshMs?: number;
}

export const RESOURCES = {
  tide: {
    url: '/api/tide',
    refreshMs: 5 * 60_000,
    pick: (json) => {
      const data = obj(json.data) as TideResponse['data'] | undefined;
      if (!data) return undefined;
      return {
        tideLevel: data.reference?.levelCm ?? null,
        tideInfo: { observedAt: data.reference?.observedAt ?? null, trend: data.trend, category: data.category, forecast: data.forecast },
        cpsmStations: list(data.stations),
        moseGates: list(data.moseGates),
      };
    },
  },
  flights: { url: '/api/flights', refreshMs: 15_000, pick: (j) => ({ flights: list(j.data) }) },
  ships: { url: '/api/ships', refreshMs: 60_000, pick: (j) => (j.success ? { ships: list(j.data) } : undefined) },
  realtimeVehicles: { url: '/api/realtime/vehicles', refreshMs: 20_000, pick: (j) => ({ realtimeVehicles: list(j.data) }) },
  windField: { url: '/api/wind-field', refreshMs: 30 * 60_000, pick: (j) => (j.success && j.data ? { windField: j.data as WindField } : undefined) },
  bdapWorks: { url: '/api/opere-bdap', pick: (j) => (j.success ? { bdapWorks: list(j.data) } : undefined) },
  lagoonNetwork: { url: '/api/lagoon-network', pick: (j) => (j.success && j.data ? { lagoonNetwork: j.data as LagoonNetwork } : undefined) },
  fiber: { url: '/api/fiber', pick: (j) => (j.success && j.data ? { fiberData: j.data as FiberDataset } : undefined) },
  nautical: { url: '/api/nautical', pick: (j) => ({ nauticalPlaces: list(j.data) }) },
  sports: { url: '/api/sports', pick: (j) => ({ sportPlaces: list(j.data) }) },
  parks: { url: '/api/parks', pick: (j) => (j.success ? { parkPlaces: list(j.data) } : undefined) },
  loraGateways: { url: '/api/lora-gateways', pick: (j) => ({ loraGateways: list(j.data) }) },
  cantieri: { url: '/api/cantieri', pick: (j) => (j.success ? { cantieri: nonEmpty(j.data) } : undefined) },
  stops: { url: '/api/stops', pick: (j) => (j.success ? { stops: nonEmpty(j.data) } : undefined) },
  cameras: { url: '/api/cameras', pick: (j) => (j.success ? { cameras: nonEmpty(j.data) } : undefined) },
  cityAssets: {
    url: '/api/city-assets',
    pick: (j) =>
      j.success
        ? {
            fountains: list(j.fountains),
            accessibleBridges: list(j.accessibleBridges),
            veritasServices: list(j.veritasServices),
            parkings: list(j.parkings),
            recyclingCentres: list(j.recyclingCentres),
            libraries: list(j.libraries),
            wifiVenues: list(j.wifiVenues),
          }
        : undefined,
  },
  environment: { url: '/api/environment', pick: (j) => ({ airStations: list(payload(j)?.airStations) }) },
  pedestrianFlows: { url: '/api/pedestrian-flows', pick: (j) => ({ pedestrianFlows: list(payload(j)?.sensors) }) },
  alilaguna: {
    url: '/api/alilaguna',
    pick: (j) => (j.success ? { alilagunaRoutes: list(j.routes), alilagunaStops: list(j.stops) } : undefined),
  },
  satellites: { url: '/api/satellites', pick: (j) => (j.success ? { satellites: list(j.data) } : undefined) },
  passerelle: { url: '/api/passerelle', pick: (j) => (j.success ? { passerelle: list(j.data) } : undefined) },
  marineSensors: {
    url: '/api/marine-sensors',
    pick: (j) => {
      const d = payload(j);
      return d && { oceanStations: list(d.oceanStations), briccole: list(d.briccole) };
    },
  },
  veniceAssets: {
    url: '/api/venice-assets',
    pick: (j) => {
      const d = payload(j);
      return d && { bathingWaters: list(d.bathingWaters), trees: list(d.urbanTrees), evCharging: list(d.evCharging), wifiHotspots: list(d.wifiHotspots) };
    },
  },
  waterways: {
    url: '/api/waterways',
    pick: (j) => {
      const d = payload(j);
      return d && { canalSpeedLimits: list(d.speedLimits), bridges: list(d.bridges), gondolas: list(d.gondolas), docks: list(d.docks) };
    },
  },
  lagoonMorphology: {
    url: '/api/lagoon-morphology',
    pick: (j) => {
      const d = payload(j);
      return d && { subsidencePoints: list(d.subsidencePoints), lagoonMorphology: list(d.lagoonMorphology) };
    },
  },
  weather: {
    url: '/api/weather',
    // Sempre caricata: la temperatura del centro è nella barra dell'orario
    refreshMs: 10 * 60_000,
    pick: (j) => {
      const d = payload(j);
      return (
        d && {
          metarData: (d.metar as AirportMetarData | undefined) ?? null,
          marineWindStations: list(d.windStations),
          cityTemp: (d.cityTemp as CityAirTemperature | undefined) ?? null,
        }
      );
    },
  },
  railLogistics: {
    url: '/api/rail-logistics',
    pick: (j) => {
      const d = payload(j);
      return d && { liveTrains: list(d.trains), wasteBoats: list(d.wasteBoats) };
    },
  },
  heritage: {
    url: '/api/heritage',
    pick: (j) => {
      const d = payload(j);
      return d && { nizioleti: list(d.nizioleti), wells: list(d.wells), bellTowers: list(d.bellTowers), fortressIslands: list(d.fortressIslands) };
    },
  },
  emergencyHealth: {
    url: '/api/emergency-health',
    pick: (j) => {
      const d = payload(j);
      return d && { emergencyDocks: list(d.emergencyDocks), daeList: list(d.dae), pharmacies: list(d.pharmacies) };
    },
  },
  urbanMicroclimate: { url: '/api/urban-microclimate', pick: (j) => ({ heatIslands: list(payload(j)?.heatIslands) }) },
  regionalData: {
    url: '/api/regional-data',
    pick: (j) => {
      const d = payload(j);
      return (
        d && {
          lagoonWaterQuality: list(d.waterQuality),
          touristAccommodations: list(d.accommodations),
          regionalBikeRoutes: list(d.bikeRoutes),
          pollenMonitoringStations: list(d.pollenStations),
          lagoonTributaryRivers: list(d.tributaryRivers),
        }
      );
    },
  },
} satisfies Record<string, ResourceSpec>;

export type DataResource = keyof typeof RESOURCES;
export const DATA_RESOURCES = Object.keys(RESOURCES) as DataResource[];

/** Patch della risposta senza i campi assenti, così i valori già caricati (o di riferimento) restano. */
export function pickResource(key: DataResource, json: unknown): Patch | undefined {
  const spec: ResourceSpec = RESOURCES[key];
  const patch = obj(json) ? spec.pick(json as Json) : undefined;
  if (!patch) return undefined;
  const out = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Patch;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Finestre e stati dell'interfaccia che richiedono dati anche con i livelli spenti. */
export interface DataNeeds {
  /** ricerca o esportazione aperte: servono gli elenchi cercabili */
  lists: boolean;
  alilagunaModal: boolean;
  airportModal: boolean;
  tideModal: boolean;
  tideSimulated: boolean;
  /** marea in città alla quota dei percorsi su passerelle: compaiono da sole */
  tideHigh?: boolean;
}

/** Quali API servono adesso. */
export function neededResources(l: LayerVisibility, ui: DataNeeds): Record<DataResource, boolean> {
  return {
    tide: true,
    flights: l.showFlights || ui.airportModal,
    ships: l.showShips,
    realtimeVehicles: l.showRealtimeVehicles,
    windField: l.showMarineWind,
    bdapWorks: l.showBdapWorks,
    lagoonNetwork: l.showMarineSignals || l.showCanals,
    fiber: l.showFiber,
    nautical: l.showNautical,
    sports: l.showSports,
    parks: l.showParks,
    loraGateways: l.showLoraGateways,
    cantieri: l.showCantieri || l.showSpatialBuffer || ui.lists,
    stops: l.showStops || ui.lists,
    cameras: l.showCameras || ui.lists,
    cityAssets: l.showCityAssets || l.showParkings || l.showRecyclingCentres || l.showLibraries || l.showWifiVenues || ui.lists,
    environment: l.showAirQuality,
    pedestrianFlows: l.showPedestrianFlows,
    alilaguna: l.showAlilaguna || ui.alilagunaModal,
    satellites: l.showSatellites,
    passerelle: l.showPasserelle || ui.tideSimulated || ui.tideModal || !!ui.tideHigh,
    marineSensors: l.showOceanStations || l.showMarineSignals || ui.lists,
    veniceAssets: l.showBathingWaters || l.showTrees || l.showEvCharging || l.showWifiHotspots,
    waterways: l.showCanalLimits || l.showBridges || l.showGondolas || l.showDocks,
    lagoonMorphology: l.showSubsidence || l.showMorphology,
    weather: true,
    railLogistics: l.showTrains || l.showWasteBoats,
    heritage: l.showNizioleti || l.showWells || l.showBellTowers || l.showFortresses || ui.lists,
    emergencyHealth: l.showEmergencyDocks || l.showDae || l.showPharmacies || ui.lists,
    urbanMicroclimate: l.showHeatIslands,
    regionalData: l.showLagoonWater || l.showAccommodations || l.showBikeRoutes || l.showPollenStations || l.showTributaries || ui.tideModal,
  };
}

/** Elementi caricati per livello, mostrati nel pannello e nella legenda accanto ai livelli accesi. */
export function layerCounts(d: CityData, extra: { scheduledVehicles: number; alilagunaBoats: number }): Partial<Record<LayerKey, number>> {
  return {
    showVehicles: extra.scheduledVehicles,
    showRealtimeVehicles: d.realtimeVehicles.length,
    showStops: d.stops.length,
    showAlilaguna: extra.alilagunaBoats,
    showCantieri: d.cantieri.length,
    showCameras: d.cameras.length,
    showFlights: d.flights.length,
    showShips: d.ships.length,
    showMose: d.moseGates.length,
    showPasserelle: d.passerelle.length,
    showMarineSignals: d.briccole.length + (d.lagoonNetwork?.markers.length ?? 0),
    showOceanStations: d.oceanStations.length,
    showBathingWaters: d.bathingWaters.length,
    showTrees: d.trees.length,
    showRecyclingCentres: d.recyclingCentres.length,
    showLibraries: d.libraries.length,
    showBdapWorks: d.bdapWorks?.filter(isLocatedBdap).length ?? 0,
    showLoraGateways: d.loraGateways.length,
    showWifiVenues: d.wifiVenues.length,
    showSports: d.sportPlaces.length,
    showParks: d.parkPlaces.length,
    showNautical: d.nauticalPlaces.length,
    showCanals: d.lagoonNetwork?.canals.length ?? 0,
    showWifiHotspots: d.wifiHotspots.length,
    showEvCharging: d.evCharging.length,
    showCityAssets: d.fountains.length,
    showParkings: d.parkings.length,
    showAirQuality: d.airStations.length,
    showPedestrianFlows: d.pedestrianFlows.length,
    showSatellites: d.satellites.length,
    showCanalLimits: d.canalSpeedLimits.length,
    showBridges: d.bridges.length,
    showGondolas: d.gondolas.length,
    showDocks: d.docks.length,
    showSubsidence: d.subsidencePoints.length,
    showMorphology: d.lagoonMorphology.length,
    showMarineWind: d.marineWindStations.length,
    showTrains: d.liveTrains.length,
    showWasteBoats: d.wasteBoats.length,
    showNizioleti: d.nizioleti.length,
    showWells: d.wells.length,
    showBellTowers: d.bellTowers.length,
    showFortresses: d.fortressIslands.length,
    showEmergencyDocks: d.emergencyDocks.length,
    showDae: d.daeList.length,
    showPharmacies: d.pharmacies.length,
    showHeatIslands: d.heatIslands.length,
    showLagoonWater: d.lagoonWaterQuality.length,
    showAccommodations: d.touristAccommodations.length,
    showBikeRoutes: d.regionalBikeRoutes.length,
    showPollenStations: d.pollenMonitoringStations.length,
    showTributaries: d.lagoonTributaryRivers.length,
    showLagoonCurrents: d.lagoonCurrents.length,
  };
}
