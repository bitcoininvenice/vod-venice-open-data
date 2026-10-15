import { GRID } from '@/lib/simulation-data';
import type { LoraGateway } from '@/lib/types';

/**
 * Gateway LoRaWAN della rete comunitaria The Things Network nell'area della mappa, dal Packet Broker Mapper.
 * Compaiono solo i gateway i cui proprietari hanno scelto di rendere pubblici stato e posizione.
 * Posizione con la stessa precisione delle mappe pubbliche di TTN (è quella pubblicata dal proprietario).
 * Tutele: solo gateway online, nessun identificativo o nome; se il proprietario rende privata la posizione,
 * il gateway sparisce da VOD alla lettura successiva (entro 10 minuti).
 */

const [LON0, LON1, LAT0, LAT1] = GRID.frame;
const CENTER = { lat: (LAT0 + LAT1) / 2, lon: (LON0 + LON1) / 2 };
/** Raggio che copre tutto il riquadro della mappa (metà diagonale, circa 24 km) */
const RADIUS_M = 25_000;

export const PACKET_BROKER_URL =
  'https://mapper.packetbroker.net/api/v2/gateways?' +
  new URLSearchParams({
    'distanceWithin[latitude]': CENTER.lat.toFixed(4),
    'distanceWithin[longitude]': CENTER.lon.toFixed(4),
    'distanceWithin[distance]': String(RADIUS_M),
  });

/** Coordinate a 6 decimali (circa 10 cm): la precisione della fonte, senza cifre spurie. */
export const roundCoord = (v: number): number => Math.round(v * 1e6) / 1e6;

const NETWORKS: Record<string, string> = { ttn: 'The Things Network', ttnv2: 'The Things Network (v2)' };

export function parseGateways(raw: unknown): LoraGateway[] {
  if (!Array.isArray(raw)) throw new Error('risposta del Packet Broker Mapper non valida');
  const out: LoraGateway[] = [];
  for (const g of raw as Record<string, unknown>[]) {
    const loc = g.location as { latitude?: unknown; longitude?: unknown; altitude?: unknown } | undefined;
    const lat = typeof loc?.latitude === 'number' ? loc.latitude : NaN;
    const lon = typeof loc?.longitude === 'number' ? loc.longitude : NaN;
    if (g.online !== true || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < LAT0 || lat > LAT1 || lon < LON0 || lon > LON1) continue;
    const tenant = typeof g.tenantID === 'string' ? g.tenantID : '';
    const placement = g.antennaPlacement === 'OUTDOOR' ? 'outdoor' : g.antennaPlacement === 'INDOOR' ? 'indoor' : null;
    out.push({
      // identificativo neutro: né ID né EUI del proprietario
      id: `lora-${out.length + 1}`,
      lat: roundCoord(lat),
      lon: roundCoord(lon),
      network: NETWORKS[tenant] ?? (tenant || 'LoRaWAN'),
      antennaPlacement: placement,
      antennaCount: typeof g.antennaCount === 'number' ? g.antennaCount : null,
      altitudeM: typeof loc?.altitude === 'number' && loc.altitude !== 0 ? Math.round(loc.altitude) : null,
      statusUpdatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : null,
    });
  }
  return out.sort((a, b) => b.lat - a.lat);
}
