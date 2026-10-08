import { NextResponse } from 'next/server';
import { OSM_SURVEILLANCE_META, VENICE_CAMERAS } from '@/lib/cameras-data';

export const revalidate = 86400;

export async function GET() {
  const liveCount = VENICE_CAMERAS.filter((c) => c.hasLiveFeed).length;
  const cctvCount = VENICE_CAMERAS.length - liveCount;

  return NextResponse.json({
    success: true,
    data: VENICE_CAMERAS,
    stats: {
      total: VENICE_CAMERAS.length,
      liveWebcams: liveCount,
      cctvMonitoring: cctvCount,
      openStreetMap: VENICE_CAMERAS.filter((c) => c.source === 'OPENSTREETMAP').length,
      anopticon: VENICE_CAMERAS.filter((c) => c.source === 'ANOPTICON_CIVIC').length,
    },
    meta: {
      liveWebcams: {
        kind: 'static-reference',
        source: 'SkylineWebcams, CNR-ISMAR',
        note: 'Solo collegamento alle pagine ufficiali dei fornitori; nessuna immagine viene ripubblicata.',
      },
      cctvMonitoring: {
        kind: 'community',
        source: 'OpenStreetMap (man_made=surveillance) + selezione Anopticon (tramaci.org)',
        sourceUrl: 'https://www.openstreetmap.org/copyright',
        license: `${OSM_SURVEILLANCE_META.license} – ${OSM_SURVEILLANCE_META.attribution}`,
        observedAt: OSM_SURVEILLANCE_META.generatedAt,
        note: 'Mappature collaborative non verificate da un ente. Il dataset completo di Anopticon non è incluso: i suoi termini d\'uso vietano l\'accesso automatico senza autorizzazione.',
      },
    },
  });
}
