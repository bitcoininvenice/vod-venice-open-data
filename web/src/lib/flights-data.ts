import { FlightItem } from '@/lib/types';

/**
 * Scheduled commercial and regional flights for Venice Marco Polo Airport (IATA: VCE, ICAO: LIPZ).
 * Used as high-fidelity fallback when OpenSky Network live ADS-B is rate-limited (HTTP 429)
 * or during nighttime hours (23:30 - 06:00) when VCE airport has an active curfew.
 */
export const SCHEDULED_VCE_FLIGHTS: FlightItem[] = [
  {
    icao24: '40082c',
    callsign: 'BAW578',
    country: 'United Kingdom 🇬🇧',
    lat: 45.3620,
    lon: 12.4480,
    altitudeMeters: 850,
    speedKmh: 310,
    trackDegrees: 42, // ILS 04R approach over the Adriatic towards Lido / Tessera
    verticalRate: -4.2,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'APPROACH'
  },
  {
    icao24: '3c66ad',
    callsign: 'DLH324',
    country: 'Germany 🇩🇪',
    lat: 45.4150,
    lon: 12.4100,
    altitudeMeters: 520,
    speedKmh: 275,
    trackDegrees: 42,
    verticalRate: -3.8,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'APPROACH'
  },
  {
    icao24: '3949e2',
    callsign: 'AFR1126',
    country: 'France 🇫🇷',
    lat: 45.2850,
    lon: 12.4950,
    altitudeMeters: 1450,
    speedKmh: 380,
    trackDegrees: 42,
    verticalRate: -5.1,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'APPROACH'
  },
  {
    icao24: '896489',
    callsign: 'UAE135',
    country: 'United Arab Emirates 🇦🇪',
    lat: 45.2100,
    lon: 12.5600,
    altitudeMeters: 2400,
    speedKmh: 460,
    trackDegrees: 350,
    verticalRate: -6.0,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'APPROACH'
  },
  {
    icao24: '300305',
    callsign: 'ITY1467',
    country: 'Italy 🇮🇹',
    lat: 45.5680,
    lon: 12.3920,
    altitudeMeters: 1650,
    speedKmh: 410,
    trackDegrees: 65,
    verticalRate: 8.5,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'DEPARTURE'
  },
  {
    icao24: '4ca831',
    callsign: 'RYR3917',
    country: 'Ireland 🇮🇪',
    lat: 45.6120,
    lon: 12.4250,
    altitudeMeters: 2800,
    speedKmh: 480,
    trackDegrees: 55,
    verticalRate: 7.2,
    onGround: false,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'DEPARTURE'
  },
  {
    icao24: '502d33',
    callsign: 'EJU3351',
    country: 'Austria 🇦🇹',
    lat: 45.5030,
    lon: 12.3510,
    altitudeMeters: 3,
    speedKmh: 24,
    trackDegrees: 222,
    verticalRate: 0.0,
    onGround: true,
    airport: 'VCE (Venezia Marco Polo)',
    status: 'TAXI'
  }
];
