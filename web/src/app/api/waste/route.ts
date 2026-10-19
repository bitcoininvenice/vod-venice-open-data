import { NextResponse } from 'next/server';
import {
  getVeniceWaste2024,
  getWasteTimeSeries,
  getWasteBenchmarks,
  getWasteMetropolitanTotal,
  WASTE_DATA,
} from '@/lib/waste';

export const revalidate = 86400;

export async function GET() {
  const venice2024 = getVeniceWaste2024();
  const timeSeries = getWasteTimeSeries();
  const benchmarks = getWasteBenchmarks();
  const metropolitanTotal = getWasteMetropolitanTotal();

  return NextResponse.json(
    {
      success: true,
      data: {
        venice2024,
        timeSeries,
        benchmarks,
        metropolitanTotal,
      },
      meta: {
        kind: 'curated-reference',
        source: WASTE_DATA.metadata.source,
        license: WASTE_DATA.metadata.license,
        note: 'Elenco curato del progetto da verificare (valori trascritti con riferimento ad ARPAV, non scaricati dal dataset ufficiale).',
        regulation: WASTE_DATA.metadata.regulation,
        updatedAt: WASTE_DATA.metadata.updatedAt,
        wasteOperator: WASTE_DATA.metadata.wasteOperator,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
