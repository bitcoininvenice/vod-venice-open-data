import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { airQualityUrl, overallPollenLevel, parseAirQuality } from '@/server/sources/openMeteoAir';
import arpavPollen from '@/data/arpav-pollen-venezia.json';
import arpavLagoon from '@/data/arpav-lagoon.json';
import type { LagoonWaterQualityItem, PollenMeasuredProfile } from '@/lib/types';

// Sonde ARPAV della laguna: ultimo campionamento in superficie per stazione (misure reali)
const LAGOON_STATIONS = arpavLagoon.stations as LagoonWaterQualityItem[];

const MEASURED: PollenMeasuredProfile = { year: arpavPollen.year, days: arpavPollen.days, families: arpavPollen.families };
import {
  REGIONAL_TOURIST_ACCOMMODATIONS,
  REGIONAL_BIKE_ROUTES,
  REGIONAL_POLLEN_STATIONS,
  REGIONAL_TRIBUTARY_RIVERS
} from '@/lib/regionalVenetoData';
import { PROVIDERS, providerLicense } from '@/lib/provenance/providers';

export const revalidate = 1800;

export async function GET() {
  // Pollini: previsione Copernicus CAMS nei punti indicati (modello, non campionamento)
  const cams = await fetchUpstream(airQualityUrl(REGIONAL_POLLEN_STATIONS), parseAirQuality, { revalidate: 1800, timeoutMs: 8000 });
  const pollenStations = REGIONAL_POLLEN_STATIONS.map((st, i) => {
    const point = cams.ok ? cams.data[i] : undefined;
    const measured = st.id === 'POL_VENEZIA' ? MEASURED : null;
    return point
      ? { ...st, validTime: point.air.validTime, pollens: point.pollens, overallAllergyRisk: overallPollenLevel(point.pollens), measured }
      : { ...st, measured };
  });
  return NextResponse.json({
    success: true,
    kind: 'curated-reference',
    source: 'Elenco curato del progetto con valori di esempio, da verificare (riferimenti: dati.veneto.it, ARPAV). Non è un download dal portale regionale.',
    pollenSource: { source: PROVIDERS.cams.name, license: providerLicense('cams'), available: cams.ok },
    waterQualitySource: { source: arpavLagoon.source, sourceUrl: arpavLagoon.sourceUrl, license: arpavLagoon.license, year: arpavLagoon.year },
    pollenMeasuredSource: { source: arpavPollen.source, sourceUrl: arpavPollen.sourceUrl, license: arpavPollen.license, year: arpavPollen.year },
    summary: {
      waterQualityCount: LAGOON_STATIONS.length,
      accommodationsCount: REGIONAL_TOURIST_ACCOMMODATIONS.length,
      bikeRoutesCount: REGIONAL_BIKE_ROUTES.length,
      pollenStationsCount: REGIONAL_POLLEN_STATIONS.length,
      tributaryRiversCount: REGIONAL_TRIBUTARY_RIVERS.length
    },
    data: {
      waterQuality: LAGOON_STATIONS,
      accommodations: REGIONAL_TOURIST_ACCOMMODATIONS,
      bikeRoutes: REGIONAL_BIKE_ROUTES,
      pollenStations,
      tributaryRivers: REGIONAL_TRIBUTARY_RIVERS
    }
  });
}
