import { NextResponse } from 'next/server';
import { CENSUS } from '@/lib/census';

export const revalidate = 86400;

/** Residenti, famiglie e abitazioni per Comune, municipalità, sestiere e isola (Censimento ISTAT 2021). */
export async function GET() {
  const { generatedAt, source, sourceUrl, license, attribution, referenceDate, method, ...data } = CENSUS;
  return NextResponse.json({
    success: true,
    data,
    meta: {
      kind: 'dataset',
      source,
      sourceUrl,
      license,
      attribution,
      referenceDate,
      generatedAt,
      method,
      note: 'Dati al 31/12/2021 (censimento permanente). Il Comune di Venezia non pubblica i residenti per sestiere come open data: i valori per sestiere e isola sono la somma delle sezioni di censimento ISTAT che cadono nel loro perimetro.',
    },
  });
}
