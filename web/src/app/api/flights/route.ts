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

// Bounding box for Venice Lagoon and Marco Polo Airport (VCE)
const LAMIN = 45.20;
const LAMAX = 45.58;
const LOMIN = 12.12;
const LOMAX = 12.52;

// Realistic simulation of flights around Marco Polo Airport (VCE)
function generateSimulatedFlights(): FlightItem[] {
  const t = Date.now() / 1000;

  return [
    {
      icao24: "400a21",
      callsign: "AZA1462",
      country: "Italy",
      // Final approach over the lagoon towards runway 04R (from Chioggia/Lido towards Tessera)
      lat: 45.4520 + Math.sin(t * 0.05) * 0.02,
      lon: 12.3850 + Math.cos(t * 0.05) * 0.015,
      altitudeMeters: 620,
      speedKmh: 260,
      trackDegrees: 42, // heading 042° towards VCE runway
      verticalRate: -4.5,
      onGround: false,
      airport: "VCE (Venezia Marco Polo)",
      status: "APPROACH"
    },
    {
      icao24: "4ca893",
      callsign: "RYR204B",
      country: "Ireland",
      // Climb-out from VCE towards Adriatic Sea
      lat: 45.5280 + (t * 0.001 % 0.08),
      lon: 12.4410 + (t * 0.001 % 0.06),
      altitudeMeters: 1850,
      speedKmh: 420,
      trackDegrees: 115,
      verticalRate: 8.2,
      onGround: false,
      airport: "VCE (Venezia Marco Polo)",
      status: "DEPARTURE"
    },
    {
      icao24: "3c65a4",
      callsign: "DLH324",
      country: "Germany",
      // Initial descent over Mestre / Terraferma
      lat: 45.4950 - Math.cos(t * 0.03) * 0.02,
      lon: 12.2250 + Math.sin(t * 0.03) * 0.02,
      altitudeMeters: 2400,
      speedKmh: 480,
      trackDegrees: 78,
      verticalRate: -5.8,
      onGround: false,
      airport: "VCE (Venezia Marco Polo)",
      status: "APPROACH"
    },
    {
      icao24: "4841c2",
      callsign: "KLM1653",
      country: "Netherlands",
      // On ground / taxiing at Marco Polo Airport
      lat: 45.5052,
      lon: 12.3515,
      altitudeMeters: 2,
      speedKmh: 28,
      trackDegrees: 222,
      verticalRate: 0,
      onGround: true,
      airport: "VCE (Venezia Marco Polo)",
      status: "TAXI"
    },
    {
      icao24: "4b1820",
      callsign: "SWR1088",
      country: "Switzerland",
      // High altitude overflight
      lat: 45.3850 + Math.cos(t * 0.02) * 0.03,
      lon: 12.2950 + Math.sin(t * 0.02) * 0.03,
      altitudeMeters: 8900,
      speedKmh: 780,
      trackDegrees: 165,
      verticalRate: 0,
      onGround: false,
      airport: "En-route",
      status: "CRUISE"
    }
  ];
}

export async function GET() {
  try {
    // Attempt to query OpenSky Network public API
    const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${LAMIN}&lomin=${LOMIN}&lamax=${LAMAX}&lomax=${LOMAX}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(openSkyUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VOD-VeniceOpenData/1.0' }
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const data = await res.json();
      if (data.states && Array.isArray(data.states) && data.states.length > 0) {
        const flights: FlightItem[] = data.states.map((s: any[]) => {
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
          data: flights
        });
      }
    }
  } catch (err) {
    // Graceful fallback to simulation
  }

  // Fallback to high-accuracy flight radar simulation over Venice
  const simulated = generateSimulatedFlights();
  return NextResponse.json({
    success: true,
    source: "VOD ADS-B Simulation (Marco Polo Airport corridors)",
    count: simulated.length,
    data: simulated
  });
}
