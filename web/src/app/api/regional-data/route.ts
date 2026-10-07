import { NextResponse } from 'next/server';
import {
  REGIONAL_LAGOON_WATER_QUALITY,
  REGIONAL_TOURIST_ACCOMMODATIONS,
  REGIONAL_BIKE_ROUTES,
  REGIONAL_POLLEN_STATIONS,
  REGIONAL_TRIBUTARY_RIVERS
} from '@/lib/regionalVenetoData';

export async function GET() {
  return NextResponse.json({
    success: true,
    portal: 'Open Data Regione del Veneto (dati.veneto.it)',
    license: 'Creative Commons Attribuzione 4.0 Internazionale (CC BY 4.0)',
    timestamp: new Date().toISOString(),
    summary: {
      waterQualityCount: REGIONAL_LAGOON_WATER_QUALITY.length,
      accommodationsCount: REGIONAL_TOURIST_ACCOMMODATIONS.length,
      bikeRoutesCount: REGIONAL_BIKE_ROUTES.length,
      pollenStationsCount: REGIONAL_POLLEN_STATIONS.length,
      tributaryRiversCount: REGIONAL_TRIBUTARY_RIVERS.length
    },
    data: {
      waterQuality: REGIONAL_LAGOON_WATER_QUALITY,
      accommodations: REGIONAL_TOURIST_ACCOMMODATIONS,
      bikeRoutes: REGIONAL_BIKE_ROUTES,
      pollenStations: REGIONAL_POLLEN_STATIONS,
      tributaryRivers: REGIONAL_TRIBUTARY_RIVERS
    }
  });
}
