import { z } from 'zod';
import type { FlightItem } from '@/lib/types';

/** Bounding box della TMA di Venezia (Tessera VCE, Treviso TSF, Chioggia, rotte adriatiche). */
const VENICE_TMA_BBOX = { lamin: 45.1, lamax: 45.72, lomin: 12.05, lomax: 12.65 } as const;

export const OPENSKY_STATES_URL =
  `https://opensky-network.org/api/states/all?lamin=${VENICE_TMA_BBOX.lamin}&lomin=${VENICE_TMA_BBOX.lomin}` +
  `&lamax=${VENICE_TMA_BBOX.lamax}&lomax=${VENICE_TMA_BBOX.lomax}`;

export const OPENSKY_TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

/**
 * State vector OpenSky (indici documentati in https://openskynetwork.github.io/opensky-api/rest.html):
 * 0 icao24, 1 callsign, 2 origin_country, 5 longitude, 6 latitude, 7 baro_altitude,
 * 8 on_ground, 9 velocity (m/s), 10 true_track, 11 vertical_rate (m/s)
 */
const StateVector = z.array(z.unknown()).min(12);
const StatesResponse = z.object({ time: z.number(), states: z.array(StateVector).nullable() });

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function parseOpenSkyStates(raw: unknown): FlightItem[] {
  const { states } = StatesResponse.parse(raw);
  if (!states) return [];
  return states.flatMap((s) => {
    const lon = num(s[5]);
    const lat = num(s[6]);
    if (lon === null || lat === null) return [];
    const alt = num(s[7]) ?? 0;
    const onGround = s[8] === true;
    const vRate = num(s[11]) ?? 0;

    let status: FlightItem['status'] = 'CRUISE';
    if (onGround) status = 'TAXI';
    else if (alt < 1500) status = vRate < 0 ? 'APPROACH' : 'DEPARTURE';

    return [{
      icao24: String(s[0] ?? ''),
      callsign: typeof s[1] === 'string' && s[1].trim() ? s[1].trim() : 'N/D',
      country: typeof s[2] === 'string' ? s[2] : '',
      lon,
      lat,
      altitudeMeters: Math.round(alt),
      speedKmh: Math.round((num(s[9]) ?? 0) * 3.6),
      trackDegrees: Math.round(num(s[10]) ?? 0),
      verticalRate: Math.round(vRate * 10) / 10,
      onGround,
      airport: alt < 3000 ? 'VCE (Venezia Marco Polo)' : 'In rotta',
      status,
    }];
  });
}
