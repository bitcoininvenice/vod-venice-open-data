import { NextResponse } from 'next/server';
import { ARPAV_AIR_META, ARPAV_AIR_STATIONS, EU_LIMITS } from '@/lib/airQuality';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      airStations: ARPAV_AIR_STATIONS,
      euLimits: EU_LIMITS,
    },
    meta: {
      kind: 'static-reference',
      source: ARPAV_AIR_META.source,
      sourceUrl: ARPAV_AIR_META.sourceUrl,
      license: ARPAV_AIR_META.license,
      observedAt: ARPAV_AIR_META.generatedAt,
      note: 'Medie annue validate dell\'anno più recente. ARPAV non pubblica un\'API aperta con i dati orari; posizioni delle stazioni indicative.',
    },
  });
}
