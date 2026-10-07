import { NextResponse } from 'next/server';
import { VENICE_CAMERAS } from '@/lib/cameras-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const liveCount = VENICE_CAMERAS.filter((c) => c.hasLiveFeed).length;
  const cctvCount = VENICE_CAMERAS.filter((c) => !c.hasLiveFeed).length;

  return NextResponse.json({
    success: true,
    stats: {
      total: VENICE_CAMERAS.length,
      liveWebcams: liveCount,
      cctvSurveillance: cctvCount
    },
    metadata: {
      regime: 'CATALOGO_IBRIDO_CERTIFICATO_E_CIVICO',
      sources: {
        liveWebcams: 'Centro Previsioni Maree (CPSM), CNR-ISMAR Acqua Alta, SkylineWebcams, I Love You Venice',
        cctvSurveillance: 'Anopticon / Tramaci.org (Mappatura civica partecipativa - Open Counter-Mapping)'
      },
      policy: {
        lazyLoad: true,
        termsNotice: 'I flussi video live vengono inizializzati esclusivamente su richiesta esplicita dell’utente (click-to-load) nel rispetto delle policy di streaming e della privacy.'
      }
    },
    cameras: VENICE_CAMERAS
  });
}
