import { NextResponse } from 'next/server';
import {
  OPEN_SUBSIDENCE_INSAR,
  OPEN_LAGOON_MORPHOLOGY,
  OPEN_METEO_MARINE_WIND
} from '@/lib/open-data-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      subsidence: OPEN_SUBSIDENCE_INSAR,
      subsidencePoints: OPEN_SUBSIDENCE_INSAR,
      morphology: OPEN_LAGOON_MORPHOLOGY,
      lagoonMorphology: OPEN_LAGOON_MORPHOLOGY,
      marineWind: OPEN_METEO_MARINE_WIND,
      marineWindStations: OPEN_METEO_MARINE_WIND
    },
    meta: {
      source: 'Copernicus EGMS (European Ground Motion Service), CNR-ISMAR, CPSM, ISPRA RMN',
      countSubsidence: OPEN_SUBSIDENCE_INSAR.length,
      countMorphology: OPEN_LAGOON_MORPHOLOGY.length,
      countWindStations: OPEN_METEO_MARINE_WIND.length,
      updatedAt: new Date().toISOString()
    }
  });
}
