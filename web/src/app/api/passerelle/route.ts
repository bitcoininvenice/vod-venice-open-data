import { NextResponse } from 'next/server';
import { PASSERELLE_DATA } from '@/lib/passerelleData';

export const revalidate = 86400;

export async function GET() {
  const totalMeters = PASSERELLE_DATA.reduce((acc, p) => acc + p.lengthMeters, 0);
  const mountedCount = PASSERELLE_DATA.filter(p => p.isMounted).length;

  return NextResponse.json({
    success: true,
    kind: 'curated-reference',
    source: 'Elenco curato del progetto, da verificare (riferimento: Comune di Venezia – CPSM). Lo stato di montaggio non è un dato in tempo reale.',
    totalMeters,
    mountedCount,
    count: PASSERELLE_DATA.length,
    data: PASSERELLE_DATA
  });
}
