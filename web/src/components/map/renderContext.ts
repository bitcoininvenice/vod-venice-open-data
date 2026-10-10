import type { AlilagunaBoat, FlightItem, LocatedCantiere, SatelliteItem, ShipItem } from '@/lib/types';
import type { ColorScheme } from '@/lib/solar';
import type { MapEngineProps } from '../MapEngine';
import type { CityData } from '@/lib/cityData';
import type { LayerVisibility } from '@/lib/layerState';
import type { SportFilter } from '@/lib/sports';

/** Tutto ciò che serve per disegnare un frame: canvas, trasformazioni, palette, stato e dati dei layer. */
export interface RenderContext
  extends LayerVisibility,
    Omit<CityData, 'cantieri' | 'tideLevel'>,
    Pick<MapEngineProps, 'bufferRadiusMeters' | 'selectedCategory' | 'selectedDay' | 'paletteTheme'> {
  /** solo opere pubbliche con posizione */
  cantieri: LocatedCantiere[];
  /** livello di marea disegnato (simulato se il simulatore è attivo) */
  tideLevel: number;
  sportFilter: SportFilter;
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
