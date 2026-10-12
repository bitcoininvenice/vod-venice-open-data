import { NextResponse } from 'next/server';
import { PASSERELLE_ROUTES, PASSERELLE_TOTAL_METERS } from '@/lib/passerelleData';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    kind: 'official-plan',
    source: 'Comune di Venezia – tabella dei percorsi su passerelle (comune.venezia.it). Tracciati sulla mappa indicativi; lo stato di montaggio non è pubblicato in tempo reale: un percorso è previsto quando la marea raggiunge la sua quota.',
    totalMeters: PASSERELLE_TOTAL_METERS,
    count: PASSERELLE_ROUTES.length,
    data: PASSERELLE_ROUTES,
  });
}
