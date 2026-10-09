import { NextResponse } from 'next/server';
import {
  REGIONAL_LAGOON_WATER_QUALITY,
  REGIONAL_TOURIST_ACCOMMODATIONS,
  REGIONAL_BIKE_ROUTES,
  REGIONAL_POLLEN_STATIONS,
  REGIONAL_TRIBUTARY_RIVERS
} from '@/lib/regionalVenetoData';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    kind: 'curated-reference',
    source: 'Elenco curato del progetto con valori di esempio, da verificare (riferimenti: dati.veneto.it, ARPAV). Non è un download dal portale regionale.',
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
