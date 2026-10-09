import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { CAMPO_API_URL, CAMPO_ATTRIBUTION, CAMPO_LICENSE_PAGE, CAMPO_SITE, parseCampo } from '@/server/sources/campo';
import { OPEN_SPORT_PLACES, OSM_POI_META } from '@/lib/osmPoi';
import { mergeSportPlaces } from '@/lib/sports';

// CAMPO riletto al massimo una volta all'ora; gli impianti OSM arrivano dalla pipeline settimanale
export const revalidate = 3600;

export async function GET() {
  const campo = await fetchUpstream(CAMPO_API_URL, parseCampo, { revalidate: 3600, timeoutMs: 8000 });
  const campoPlaces = campo.ok ? campo.data.places : [];
  const data = mergeSportPlaces(campoPlaces, OPEN_SPORT_PLACES);
  return NextResponse.json({
    success: true,
    count: data.length,
    data,
    meta: {
      kind: 'static-reference',
      sources: [
        {
          name: 'CAMPO – mappa della comunità degli spazi sportivi di Venezia',
          url: CAMPO_SITE,
          license: campo.ok ? campo.data.meta.license : 'CC BY 4.0',
          licenseUrl: campo.ok ? campo.data.meta.licenseUrl : null,
          attribution: campo.ok ? campo.data.meta.attribution : CAMPO_ATTRIBUTION,
          disclaimer: campo.ok ? campo.data.meta.disclaimer : null,
          licensePage: CAMPO_LICENSE_PAGE,
          count: campoPlaces.length,
          fetchedAt: campo.ok ? campo.fetchedAt : null,
          error: campo.ok ? undefined : campo.error,
        },
        {
          name: 'OpenStreetMap (leisure=pitch, sports_centre, fitness_station, track, stadium, sports_hall)',
          url: 'https://www.openstreetmap.org',
          license: OSM_POI_META.license,
          attribution: '© OpenStreetMap contributors',
          count: data.length - campoPlaces.length,
          generatedAt: OSM_POI_META.generatedAt,
        },
      ],
      note: 'Le segnalazioni CAMPO prevalgono sugli impianti OpenStreetMap entro 60 m. Gli spazi parrocchiali (patronati) seguono gli orari e le regole del luogo; orari e condizioni non sono verificati da VOD.',
    },
  });
}
