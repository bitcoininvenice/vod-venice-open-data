import { NextResponse } from 'next/server';
import { ARPAV_AIR_META, ARPAV_AIR_STATIONS, EU_LIMITS } from '@/lib/airQuality';
import { fetchUpstream } from '@/server/upstream';
import { airQualityUrl, parseAirQuality } from '@/server/sources/openMeteoAir';
import { PROVIDERS, providerLicense } from '@/lib/provenance/providers';

// Le medie ARPAV sono annuali; la previsione CAMS cambia ogni ora
export const revalidate = 1800;

export async function GET() {
  const cams = await fetchUpstream(airQualityUrl(ARPAV_AIR_STATIONS), parseAirQuality, { revalidate: 1800, timeoutMs: 8000 });
  const airStations = ARPAV_AIR_STATIONS.map((s, i) => ({ ...s, forecast: cams.ok ? cams.data[i]?.air ?? null : null }));
  return NextResponse.json({
    success: true,
    data: {
      airStations,
      euLimits: EU_LIMITS,
    },
    meta: {
      kind: 'static-reference',
      source: ARPAV_AIR_META.source,
      sourceUrl: ARPAV_AIR_META.sourceUrl,
      license: ARPAV_AIR_META.license,
      observedAt: ARPAV_AIR_META.generatedAt,
      note: 'Medie annue validate dell\'anno più recente. ARPAV non pubblica un\'API aperta con i dati orari; posizioni delle stazioni indicative.',
      forecast: {
        source: PROVIDERS.cams.name,
        license: providerLicense('cams'),
        available: cams.ok,
        note: 'Previsione oraria del modello Copernicus CAMS nel punto di ogni stazione: non è una misura ARPAV.',
      },
    },
  });
}
