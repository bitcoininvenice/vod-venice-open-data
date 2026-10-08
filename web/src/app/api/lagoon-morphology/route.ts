import { NextResponse } from 'next/server';
import {
  OPEN_SUBSIDENCE_INSAR,
  OPEN_LAGOON_MORPHOLOGY
} from '@/lib/open-data-catalog';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      subsidencePoints: OPEN_SUBSIDENCE_INSAR,
      lagoonMorphology: OPEN_LAGOON_MORPHOLOGY
    },
    meta: {
      source: 'Copernicus EGMS (European Ground Motion Service), CNR-ISMAR',
      countSubsidence: OPEN_SUBSIDENCE_INSAR.length,
      countMorphology: OPEN_LAGOON_MORPHOLOGY.length,
    }
  });
}
