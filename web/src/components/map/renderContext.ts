import type { AlilagunaBoat, FlightItem, SatelliteItem, ShipItem } from '@/lib/types';
import type { ColorScheme } from '@/lib/solar';
import type { MapEngineProps } from '../MapEngine';

type DataProps = 'accessibleBridges' | 'airStations' | 'alilagunaRoutes' | 'alilagunaStops' | 'bathingWaters' | 'bellTowers' | 'briccole' | 'bridges' | 'bufferRadiusMeters' | 'cameras' | 'canalSpeedLimits' | 'cantieri' | 'daeList' | 'docks' | 'emergencyDocks' | 'evCharging' | 'flights' | 'fortressIslands' | 'fountains' | 'gondolas' | 'heatIslands' | 'lagoonMorphology' | 'lagoonTributaryRivers' | 'lagoonWaterQuality' | 'liveTrains' | 'marineWindStations' | 'moseGates' | 'nizioleti' | 'oceanStations' | 'paletteTheme' | 'parkings' | 'passerelle' | 'pedestrianFlows' | 'pharmacies' | 'pollenMonitoringStations' | 'realtimeVehicles' | 'regionalBikeRoutes' | 'satellites' | 'selectedCategory' | 'selectedDay' | 'ships' | 'showAccommodations' | 'showAirQuality' | 'showAlilaguna' | 'showBathingWaters' | 'showBellTowers' | 'showBikeRoutes' | 'showBridges' | 'showCameras' | 'showCanalLimits' | 'showCantieri' | 'showCityAssets' | 'showDae' | 'showDocks' | 'showEmergencyDocks' | 'showEvCharging' | 'showFlights' | 'showFortresses' | 'showGondolas' | 'showHeatIslands' | 'showLagoonWater' | 'showMarineSignals' | 'showMarineWind' | 'showMorphology' | 'showMose' | 'showNizioleti' | 'showOceanStations' | 'showParkings' | 'showPasserelle' | 'showPedestrianFlows' | 'showPharmacies' | 'showPollenStations' | 'showRealtimeVehicles' | 'showRoutes' | 'showSatellites' | 'showShipRoutes' | 'showShips' | 'showSpatialBuffer' | 'showStops' | 'showSubsidence' | 'showTrains' | 'showTrees' | 'showTributaries' | 'showVehicles' | 'showWasteBoats' | 'showWells' | 'showWifiHotspots' | 'stops' | 'subsidencePoints' | 'tideLevel' | 'touristAccommodations' | 'trees' | 'veritasServices' | 'wasteBoats' | 'wells' | 'wifiHotspots';

/** Tutto ciò che serve per disegnare un frame: canvas, trasformazioni, palette, stato e dati dei layer. */
export interface RenderContext extends Required<Pick<MapEngineProps, DataProps>> {
  ctx: CanvasRenderingContext2D;
  /** dimensioni del canvas in pixel CSS */
  cw: number;
  ch: number;
  dpr: number;
  pal: ColorScheme;
  isDark: boolean;
  /** coordinate di griglia -> schermo */
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** longitudine/latitudine -> coordinate di griglia */
  mx: (lon: number) => number;
  my: (lat: number) => number;
  camera: { x0: number; y0: number; s: number };
  W: number;
  H: number;
  KY: number;
  zoomed: boolean;
  currentTimeSeconds: number;
  selectedFlight: FlightItem | null;
  selectedShipOnMap: ShipItem | null;
  selectedAlilagunaBoat: AlilagunaBoat | null;
  selectedSatellite: SatelliteItem | null;
}
