import { NextResponse } from 'next/server';
import { VENICE_CAMERAS } from '@/lib/cameras-data';

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
    },
    meta: {
      liveWebcams: {
        kind: 'static-reference',
        source: 'SkylineWebcams, CNR-ISMAR',
        note: 'Solo collegamento alle pagine ufficiali dei fornitori; nessuna immagine viene ripubblicata.',
      },
      cctvMonitoring: {
        kind: 'community',
        source: 'Anopticon (tramaci.org) – mappatura civica',
        sourceUrl: 'https://tramaci.org/anopticon/',
        note: 'Posizioni indicative non verificate; titolare degli impianti non noto.',
      },
    },
  });
}
