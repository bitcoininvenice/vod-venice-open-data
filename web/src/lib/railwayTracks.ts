/**
 * Venice Railway Tracks & Snapping System (RFI / OpenStreetMap)
 *
 * Allinea con precisione millimetrica le coordinate dei treni in tempo reale
 * (Trenitalia e Italo) all'asse del viadotto ferroviario lagunare (Ponte della Liberta),
 * allo scalo di Santa Lucia e al nodo di Mestre, calcolando l'angolo di rotta
 * (bearing) per orientare correttamente i convogli sui binari.
 */

export interface RailwayTrackPoint {
  lon: number;
  lat: number;
  label?: string;
}

/**
 * Polilinea ad alta risoluzione del corridoio ferroviario RFI:
 * Dalla stazione di testa di Venezia Santa Lucia attraverso il viadotto
 * lagunare storico a 4 binari fino a Venezia Porto Marghera e Venezia Mestre.
 */
export const VENICE_RAILWAY_MAINLINE: RailwayTrackPoint[] = [
  { lon: 12.3210, lat: 45.4412, label: 'Venezia Santa Lucia - Banchine' },
  { lon: 12.3168, lat: 45.4435, label: 'Scalo Santa Lucia / San Giobbe' },
  { lon: 12.3142, lat: 45.4452, label: 'Imbocco Viadotto Lagunare' },
  { lon: 12.3105, lat: 45.4472, label: 'Ponte della Liberta Est' },
  { lon: 12.3085, lat: 45.4484, label: 'Ponte della Liberta Spalla Laguna' },
  { lon: 12.2795, lat: 45.4647, label: 'Ponte Ferroviario Laguna Centro-Est' },
  { lon: 12.2740, lat: 45.4674, label: 'Ponte Ferroviario Laguna Centro' },
  { lon: 12.2693, lat: 45.4690, label: 'Ponte Ferroviario Laguna Centro-Ovest' },
  { lon: 12.2622, lat: 45.4704, label: 'Ponte Ferroviario Laguna Ovest' },
  { lon: 12.2571, lat: 45.4718, label: 'Ponte Ferroviario Spalla Ovest' },
  { lon: 12.2527, lat: 45.4747, label: 'Raccordo Parco Scientifico VEGA' },
  { lon: 12.2500, lat: 45.4768, label: 'Bivio Marghera' },
  { lon: 12.2462, lat: 45.4784, label: 'Venezia Porto Marghera' },
  { lon: 12.2392, lat: 45.4797, label: 'Raccordo Mestre FS' },
  { lon: 12.2355, lat: 45.4812, label: 'Ingresso Nodo Mestre' },
  { lon: 12.2318, lat: 45.4828, label: 'Venezia Mestre - Binari Viaggiatori' },
  { lon: 12.2240, lat: 45.4840, label: 'Bivio Mirano / Mestre Ovest' },
  { lon: 12.2150, lat: 45.4835, label: 'Direttrice Padova / Milano' },
];

export const VENICE_RAILWAY_BRANCH_TREVISO: RailwayTrackPoint[] = [
  { lon: 12.2318, lat: 45.4828, label: 'Venezia Mestre' },
  { lon: 12.2335, lat: 45.4880, label: 'Bivio Carpenedo' },
  { lon: 12.2360, lat: 45.4950, label: 'Direttrice Treviso / Udine / Trieste' },
];

export interface SnappedRailwayResult {
  lon: number;
  lat: number;
  bearing: number;
  distanceMeters: number;
  snapped: boolean;
}

const COS_LAT_VENICE = Math.cos((45.45 * Math.PI) / 180);
const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LON = METERS_PER_DEG_LAT * COS_LAT_VENICE;

function projectPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number; t: number; bearingOutbound: number } {
  const dx = (bx - ax) * COS_LAT_VENICE;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  // Tangente del segmento da A verso B (direzione da Santa Lucia verso Mestre/terraferma)
  const rad = Math.atan2(dx, dy);
  const bearingOutbound = ((rad * 180) / Math.PI + 360) % 360;

  if (lenSq === 0) {
    return { x: ax, y: ay, t: 0, bearingOutbound };
  }

  const pX = (px - ax) * COS_LAT_VENICE;
  const pY = py - ay;
  const t = Math.max(0, Math.min(1, (pX * dx + pY * dy) / lenSq));

  const projX = ax + t * (bx - ax);
  const projY = ay + t * (by - ay);

  return { x: projX, y: projY, t, bearingOutbound };
}

function computeDistanceMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dLonM = (lon2 - lon1) * METERS_PER_DEG_LON;
  const dLatM = (lat2 - lat1) * METERS_PER_DEG_LAT;
  return Math.sqrt(dLonM * dLonM + dLatM * dLatM);
}

/**
 * Verifica se la destinazione del convoglio e Venezia Santa Lucia (inbound).
 */
export function isInboundToSantaLucia(destination?: string): boolean {
  if (!destination) return false;
  const s = destination.toLowerCase();
  return s.includes('santa lucia') || s.includes('s. lucia') || s.includes('venezia s.l.') || s === 'venezia' || s === 'venice';
}

/**
 * Calcola la posizione proiettata sull'asse ferroviario reale e ne determina la rotta (bearing).
 * Se il punto e entro maxDistanceMeters dal tracciato (default 600m), viene agganciato
 * perfettamente ai binari.
 */
export function snapTrainToRailway(
  lon: number,
  lat: number,
  options?: {
    destination?: string;
    rawBearing?: number;
    maxDistanceMeters?: number;
  }
): SnappedRailwayResult {
  const maxDist = options?.maxDistanceMeters ?? 650;
  const tracks = [VENICE_RAILWAY_MAINLINE, VENICE_RAILWAY_BRANCH_TREVISO];

  let bestDist = Infinity;
  let bestLon = lon;
  let bestLat = lat;
  let bestBearingOutbound = 300;

  for (const track of tracks) {
    for (let i = 0; i < track.length - 1; i++) {
      const pA = track[i];
      const pB = track[i + 1];
      const proj = projectPointOnSegment(lon, lat, pA.lon, pA.lat, pB.lon, pB.lat);
      const dist = computeDistanceMeters(lon, lat, proj.x, proj.y);

      if (dist < bestDist) {
        bestDist = dist;
        bestLon = proj.x;
        bestLat = proj.y;
        bestBearingOutbound = proj.bearingOutbound;
      }
    }
  }

  // Direzione verso Santa Lucia (inbound) e l'opposto di outbound
  const bearingInbound = (bestBearingOutbound + 180) % 360;

  let finalBearing: number;
  const isInbound = isInboundToSantaLucia(options?.destination);

  if (options?.rawBearing !== undefined && Number.isFinite(options.rawBearing)) {
    // Se abbiamo una rotta grezza, scegliamo il verso (inbound o outbound) piu vicino
    const diffOutbound = Math.abs(((options.rawBearing - bestBearingOutbound + 540) % 360) - 180);
    const diffInbound = Math.abs(((options.rawBearing - bearingInbound + 540) % 360) - 180);
    finalBearing = diffInbound < diffOutbound ? bearingInbound : bestBearingOutbound;
  } else if (isInbound) {
    finalBearing = bearingInbound;
  } else {
    finalBearing = bestBearingOutbound;
  }

  const snapped = bestDist <= maxDist;

  return {
    lon: snapped ? Number(bestLon.toFixed(6)) : lon,
    lat: snapped ? Number(bestLat.toFixed(6)) : lat,
    bearing: Math.round(finalBearing),
    distanceMeters: Math.round(bestDist),
    snapped,
  };
}
