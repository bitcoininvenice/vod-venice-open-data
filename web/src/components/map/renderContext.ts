import type { AlilagunaBoat, FlightItem, LocatedCantiere, SatelliteItem, ShipItem } from '@/lib/types';
import type { ColorScheme } from '@/lib/solar';
import type { MapEngineProps } from '../MapEngine';
import type { CityData } from '@/lib/cityData';
import type { LayerVisibility } from '@/lib/layerState';
import type { SportFilter } from '@/lib/sports';
import type { FuelKind } from '@/lib/fuel';
import type { SelectedTrip } from '@/lib/tripView';
import type { Itinerary } from '@/lib/tripPlanner';
import type { DynamicTideState } from '@/lib/tideCurve';
import type { OrdinanceItem } from '@/lib/contracts/ordinances';

interface HighlightTrip extends SelectedTrip {
  color: string;
  /** ritardo del mezzo (s), per segnare le fermate già servite */
  delaySeconds: number;
  /** ora corrente in secondi dalla mezzanotte */
  now: number;
}

/** Tutto ciò che serve per disegnare un frame: canvas, trasformazioni, palette, stato e dati dei layer. */
export interface RenderContext
  extends LayerVisibility,
    Omit<CityData, 'cantieri' | 'tideLevel'>,
    Pick<MapEngineProps, 'bufferRadiusMeters' | 'selectedCategory' | 'selectedDay' | 'paletteTheme'> {
  /** solo opere pubbliche con posizione */
  cantieri: LocatedCantiere[];
  /** livello di marea in città (0 se non disponibile) */
  tideLevel: number;
  /** stato completo della marea e del MOSE (con origine dei dati) */
  tide: DynamicTideState;
  /** canali (id OSM) con ordinanze temporanee di traffico acqueo in vigore o in arrivo */
  canalOrdinances: Map<number, OrdinanceItem[]>;
  sportFilter: SportFilter;
  /** carburante confrontato nel livello dei distributori */
  fuelFilter: FuelKind;
  /** itinerario del planner */
  itinerary: Itinerary | null;
  /** segnaposto di un luogo cercato */
  pin: { lat: number; lon: number; approximate: boolean } | null;
  /** corsa del mezzo selezionato da evidenziare (null se nessuna) */
  selectedTrip: HighlightTrip | null;
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
  /** traduzione delle etichette disegnate sulla mappa */
  t: (path: string, params?: Record<string, string | number>) => string;
}
