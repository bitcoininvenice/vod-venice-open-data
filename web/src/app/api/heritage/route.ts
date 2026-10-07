import { NextResponse } from 'next/server';
import {
  OPEN_NIZIOLETI_CIVICI,
  OPEN_VENICE_WELLS,
  OPEN_BELL_TOWERS,
  OPEN_LAGOON_FORTRESS_ISLANDS
} from '@/lib/open-data-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      nizioleti: OPEN_NIZIOLETI_CIVICI,
      wells: OPEN_VENICE_WELLS,
      bellTowers: OPEN_BELL_TOWERS,
      fortressIslands: OPEN_LAGOON_FORTRESS_ISLANDS
    },
    meta: {
      source: 'Venice Project Center (iZioleti, Venice Wells, Venice Bells), Soprintendenza ABAP, Demanio',
      countNizioleti: OPEN_NIZIOLETI_CIVICI.length,
      countWells: OPEN_VENICE_WELLS.length,
      countBellTowers: OPEN_BELL_TOWERS.length,
      countFortressIslands: OPEN_LAGOON_FORTRESS_ISLANDS.length,
      updatedAt: new Date().toISOString()
    }
  });
}
