/**
 * Limiti di velocità nei canali, ricavati dagli atti ufficiali (non da mappe: le cartografie del Comune
 * non sono modificabili) e applicati ai canali di OpenStreetMap con lo stesso nome.
 *
 * Fase 1:
 * - rii e canali del Comune di Venezia: Regolamento per la circolazione acquea (art. 2 e 3);
 * - canali lagunari del Provveditorato OO.PP. (ex Magistrato alle Acque): Ordinanza 93/2007, solo i canali
 *   con un unico limite su tutta la lunghezza. Restano esclusi i tratti parziali e i canali della Capitaneria.
 *
 * Non per la navigazione: valgono la segnaletica e gli atti vigenti.
 */
import type { CanalSpeedLimitItem } from './types';

export const COMUNE_REGULATION_URL =
  'https://www.comune.venezia.it/sites/default/files/flex/files/f/a/4/D.c442a6c2ee4f14450b01/Regolamento_circolazione_acquea_marzo_2016.pdf';
export const ORDINANCE_93_2007_URL =
  'https://www.comune.venezia.it/sites/default/files/flex/files/7/f/8/D.5917948418e2be82affa/ord_magistrato_n_93_del_2007.pdf';

/** Marea (cm sullo ZMPS) oltre la quale valgono le regole dell'art. 3 del regolamento comunale */
export const HIGH_WATER_CM = 110;
export const LOW_WATER_CM = -50;

interface OsmCanal {
  id: number;
  name: string | null;
  coords: [number, number][];
}

type Area = 'centro' | 'murano' | 'burano' | 'chioggia' | 'other';

/** Zona del canale (punto medio del tracciato) */
function areaOf(coords: [number, number][]): Area {
  const [lon, lat] = coords[Math.floor(coords.length / 2)];
  if (lon >= 12.3 && lon <= 12.372 && lat >= 45.423 && lat <= 45.452) return 'centro';
  if (lon >= 12.343 && lon <= 12.362 && lat >= 45.449 && lat <= 45.463) return 'murano';
  if (lon >= 12.405 && lon <= 12.425 && lat >= 45.48 && lat <= 45.492) return 'burano';
  if (lat < 45.26) return 'chioggia';
  return 'other';
}

const isRio = (name: string) => /^rio(lo|\b)|^rielo\b/i.test(name);

/**
 * Regolamento comunale, art. 2 c.1: limiti per i mezzi a motore (ACTV / altri).
 * Si applica ai rii di Venezia, Murano e Burano; Chioggia è un altro Comune.
 */
function comuneRule(name: string, area: Area): Pick<CanalSpeedLimitItem, 'maxSpeedKmh' | 'actvSpeedKmh' | 'highWater'> | null {
  if (area === 'chioggia' || area === 'other') return null;
  const centro = area === 'centro';
  if (name === 'Canal Grande' && centro) return { maxSpeedKmh: 7, actvSpeedKmh: 11, highWater: 'slow5' };
  if (name === 'Canale di Cannaregio') return { maxSpeedKmh: 5, actvSpeedKmh: 7, highWater: 'slow5' };
  if (name === 'Rio Novo' || name === "Rio de Ca' Foscari") return { maxSpeedKmh: 5, actvSpeedKmh: null, highWater: centro ? 'noMotor' : null };
  if (isRio(name)) return { maxSpeedKmh: 5, actvSpeedKmh: 7, highWater: centro ? 'noMotor' : null };
  return null;
}

/**
 * Ordinanza 93/2007, artt. 13-17: canali con un unico limite su tutta la lunghezza, per nome OSM.
 * I canali che l'ordinanza limita solo per tratti ("dal… al…", "esclusi…") non sono in elenco.
 */
const ORDINANCE_93: Record<string, { kmh: number; art: number }> = {
  'Canale Scirocchetto': { kmh: 7, art: 14 },
  'Canale Serraglia': { kmh: 7, art: 14 },
  'Canale di Crevan': { kmh: 7, art: 14 },
  'Canale della Grazia': { kmh: 7, art: 14 },
  'Canale Fasiol': { kmh: 7, art: 14 },
  'Canale dei Lavraneri': { kmh: 7, art: 14 },
  'Ghebo dei Cani': { kmh: 7, art: 14 },
  'Canale San Domenico Interno': { kmh: 7, art: 14 },
  'Canale San Domenico Esterno': { kmh: 7, art: 14 },
  'Canale delle Tresse': { kmh: 11, art: 15 },
  'Canale Fisolo': { kmh: 11, art: 15 },
  'Canale Spignon': { kmh: 11, art: 15 },
  'Canale delle Fosse': { kmh: 11, art: 15 },
  'Canale Orfanello': { kmh: 14, art: 16 },
  'Canale Orfano': { kmh: 14, art: 16 },
  'Canale di Valgrande': { kmh: 14, art: 16 },
  'Canale Perognola': { kmh: 14, art: 16 },
  'Canale di Lio': { kmh: 14, art: 16 },
  'Canale Nuovo di Fusina': { kmh: 14, art: 16 },
  'Canale Vecchio di Fusina': { kmh: 14, art: 16 },
};

export type CanalLimit = Pick<CanalSpeedLimitItem, 'maxSpeedKmh' | 'actvSpeedKmh' | 'highWater' | 'authority' | 'legalRef' | 'sourceUrl'>;

/** Limite di un canale per nome e tracciato, se un atto lo fissa (comunale o ordinanza 93/2007). */
export function canalLimit(name: string | null, coords: [number, number][]): CanalLimit | null {
  if (!name || coords.length < 2) return null;
  const comune = comuneRule(name, areaOf(coords));
  if (comune) {
    return { ...comune, authority: 'comune', legalRef: 'Regolamento per la circolazione acquea nel Comune di Venezia, art. 2 e 3', sourceUrl: COMUNE_REGULATION_URL };
  }
  const ord = ORDINANCE_93[name];
  if (ord) {
    return {
      maxSpeedKmh: ord.kmh,
      actvSpeedKmh: null,
      highWater: null,
      authority: 'provveditorato',
      legalRef: `Ordinanza 93/2007 del Magistrato alle Acque (ora Provveditorato OO.PP.), art. ${ord.art}`,
      sourceUrl: ORDINANCE_93_2007_URL,
    };
  }
  return null;
}

/** Zona di un tratto senza nome: nel centro storico, a Murano e a Burano i tratti senza nome sono rii. */
export function urbanArea(coords: [number, number][]): 'centro' | 'murano' | 'burano' | null {
  const a = areaOf(coords);
  return a === 'centro' || a === 'murano' || a === 'burano' ? a : null;
}

/** Limiti per ogni canale OSM riconosciuto (uno per tratto, con il tracciato del canale). */
export function buildSpeedLimits(canals: OsmCanal[]): CanalSpeedLimitItem[] {
  const out: CanalSpeedLimitItem[] = [];
  for (const c of canals) {
    const limit = canalLimit(c.name, c.coords);
    if (limit) out.push({ id: `speed-${c.id}`, channelName: c.name as string, ...limit, path: c.coords });
  }
  return out;
}

/**
 * Limite valido con la marea indicata (art. 3 del regolamento comunale):
 * con +110 cm o più nel Canal Grande e a Cannaregio al massimo 5 km/h (anche con -50 cm o meno),
 * negli altri rii del centro storico la circolazione a motore è vietata.
 */
export function effectiveSpeedLimit(
  item: Pick<CanalSpeedLimitItem, 'maxSpeedKmh' | 'actvSpeedKmh' | 'highWater'>,
  tideCm: number | null | undefined,
): { kmh: number | null; actvKmh: number | null; noMotor: boolean; tideRule: boolean } {
  const base = { kmh: item.maxSpeedKmh, actvKmh: item.actvSpeedKmh, noMotor: false, tideRule: false };
  if (tideCm == null || !item.highWater) return base;
  if (item.highWater === 'slow5' && (tideCm >= HIGH_WATER_CM || tideCm <= LOW_WATER_CM)) {
    return { kmh: 5, actvKmh: 5, noMotor: false, tideRule: true };
  }
  if (item.highWater === 'noMotor' && tideCm >= HIGH_WATER_CM) {
    return { kmh: null, actvKmh: null, noMotor: true, tideRule: true };
  }
  return base;
}

/** Colore per limite di velocità (scala crescente) */
export function speedColor(kmh: number | null, isDark: boolean): string {
  if (kmh == null) return isDark ? '#94a3b8' : '#475569';
  if (kmh <= 5) return isDark ? '#22d3ee' : '#0891b2';
  if (kmh <= 7) return isDark ? '#facc15' : '#ca8a04';
  if (kmh <= 11) return isDark ? '#fb923c' : '#ea580c';
  if (kmh <= 14) return isDark ? '#e879f9' : '#c026d3';
  return isDark ? '#60a5fa' : '#1e40af';
}
