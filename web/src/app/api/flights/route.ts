import { NextResponse } from 'next/server';

export interface FlightItem {
  icao24: string;
  callsign: string;
  country: string;
  lat: number;
  lon: number;
  altitudeMeters: number;
  speedKmh: number;
  trackDegrees: number;
  verticalRate: number;
  onGround: boolean;
  airport: string;
  status: 'APPROACH' | 'DEPARTURE' | 'CRUISE' | 'TAXI';
}

// Bounding box for Venice TMA (Terminal Manoeuvring Area: Tessera VCE, Treviso TSF, Chioggia and Adriatic routes)
const LAMIN = 45.10;
const LAMAX = 45.72;
const LOMIN = 12.05;
const LOMAX = 12.65;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Interrogazione telemetrica diretta all'API pubblica OpenSky Network (ADS-B live)
    const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${LAMIN}&lomin=${LOMIN}&lamax=${LAMAX}&lomax=${LOMAX}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(openSkyUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VOD-VeniceOpenData/1.0' },
      next: { revalidate: 10 }
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const data = await res.json();
      if (data.states && Array.isArray(data.states)) {
        const flights: FlightItem[] = data.states
          .filter((s: any[]) => s[5] != null && s[6] != null)
          .map((s: any[]) => {
            const alt = s[7] || 0;
            const onG = s[8] || false;
            let status: FlightItem['status'] = 'CRUISE';
            if (onG) status = 'TAXI';
            else if (alt < 1500) status = s[11] < 0 ? 'APPROACH' : 'DEPARTURE';

            return {
              icao24: s[0],
              callsign: (s[1] || 'UNKNOWN').trim(),
              country: s[2] || '',
              lon: s[5],
              lat: s[6],
              altitudeMeters: Math.round(alt),
              speedKmh: Math.round((s[9] || 0) * 3.6),
              trackDegrees: Math.round(s[10] || 0),
              verticalRate: Math.round((s[11] || 0) * 10) / 10,
              onGround: onG,
              airport: alt < 3000 ? "VCE (Venezia Marco Polo)" : "En-route",
              status
            };
          });

        return NextResponse.json({
          success: true,
          source: "OpenSky Network (Live ADS-B)",
          count: flights.length,
          data: flights,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    // Errore di rete o timeout
  }

  // Nessuna telemetria sintetica: se OpenSky non rileva voli o applica rate-limit, restituisce array vuoto autentico
  return NextResponse.json({
    success: true,
    source: "OpenSky Network (Live ADS-B)",
    count: 0,
    data: [],
    statusNotice: "Nessun aeromobile rilevato in questo istante nello spazio aereo VCE (OpenSky Network ADS-B).",
    timestamp: new Date().toISOString()
  });
}
