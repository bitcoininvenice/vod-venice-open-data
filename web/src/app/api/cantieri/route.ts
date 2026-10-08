import { NextResponse } from 'next/server';
import { fetchCantieri } from '@/lib/db';

export const revalidate = 86400;

export async function GET() {
  const cantieri = await fetchCantieri();
  return NextResponse.json({
    success: true,
    count: cantieri.length,
    data: cantieri,
    meta: {
      kind: 'static-reference',
      source: 'Elenco cantieri incluso nel codice',
      note: 'Dataset statico non collegato al portale dati.venezia.it: va sostituito con l\'importazione dei cantieri pubblicati dal Comune.',
    },
  });
}
