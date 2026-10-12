import { NextResponse } from 'next/server';
import { PASSERELLE_DATA } from '@/lib/passerelleData';

export const revalidate = 86400;

export async function GET() {
  const totalMeters = PASSERELLE_DATA.reduce((acc, p) => acc + p.lengthMeters, 0);
  const mountedCount = PASSERELLE_DATA.filter(p => p.isMounted).length;

  return NextResponse.json({
    success: true,
    kind: 'official-plan',
    source: 'Comune di Venezia – Centro Previsioni e Segnalazioni Maree (CPSM) & Veritas S.p.A. (Piano di Viabilità Pedonale su passerelle).',
    totalMeters,
    mountedCount,
    count: PASSERELLE_DATA.length,
    data: PASSERELLE_DATA
  });
}
