import { NextResponse } from 'next/server';
import { MARITIME_ROUTES, SHIPS_REFERENCE } from '@/lib/shipsData';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    totalShips: SHIPS_REFERENCE.length,
    regulationNotice: "Decreto Legge 103/2021: navi passeggeri >25.000 GT instradate a Marghera via Canale dei Petroli; navi <25.000 GT e traghetti autorizzati a Tronchetto / San Basilio.",
    meta: {
      kind: 'static-reference',
      source: 'Anagrafica canali marittimi e banchine (AdSP Mare Adriatico Settentrionale)',
      note: 'Le navi indicate sono un elenco di riferimento con banchina assegnata, non posizioni AIS in tempo reale.',
    },
    routes: MARITIME_ROUTES,
    data: SHIPS_REFERENCE,
  });
}
