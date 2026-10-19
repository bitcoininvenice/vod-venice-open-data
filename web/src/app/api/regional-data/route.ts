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
import { AIRBNB_DATA } from '@/lib/airbnb';
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
    kind: 'hybrid-regional',
    source: 'Dati reali da ARPAV (sonde lagunari e calendario pollinico), Copernicus CAMS (previsione pollini) e Inside Airbnb + ISTAT 2021 (locazioni brevi), affiancati a tracciati ciclabili e fiumi tributari curati dal progetto.',
    pollenSource: { source: PROVIDERS.cams.name, license: providerLicense('cams'), available: cams.ok },
    waterQualitySource: { source: arpavLagoon.source, sourceUrl: arpavLagoon.sourceUrl, license: arpavLagoon.license, year: arpavLagoon.year },
    pollenMeasuredSource: { source: arpavPollen.source, sourceUrl: arpavPollen.sourceUrl, license: arpavPollen.license, year: arpavPollen.year },
    accommodationsSource: {
      source: PROVIDERS.insideAirbnb.name,
      sourceUrl: PROVIDERS.insideAirbnb.url,
      license: providerLicense('insideAirbnb'),
      snapshotDate: AIRBNB_DATA.snapshotDate,
      totalListings: AIRBNB_DATA.totalListings,
    },
    summary: {
      waterQualityCount: LAGOON_STATIONS.length,
      accommodationsCount: REGIONAL_TOURIST_ACCOMMODATIONS.length,
      accommodationsTotalListings: AIRBNB_DATA.totalListings,
      bikeRoutesCount: REGIONAL_BIKE_ROUTES.length,
      pollenStationsCount: REGIONAL_POLLEN_STATIONS.length,
      tributaryRiversCount: REGIONAL_TRIBUTARY_RIVERS.length
    },
    data: {
      waterQuality: LAGOON_STATIONS,
      accommodations: REGIONAL_TOURIST_ACCOMMODATIONS,
      accommodationsSummary: {
        snapshotDate: AIRBNB_DATA.snapshotDate,
        totalListings: AIRBNB_DATA.totalListings,
        city: AIRBNB_DATA.city,
        historicCentre: AIRBNB_DATA.historicCentre,
      },
      bikeRoutes: REGIONAL_BIKE_ROUTES,
      pollenStations,
      tributaryRivers: REGIONAL_TRIBUTARY_RIVERS
    }
  });
}
