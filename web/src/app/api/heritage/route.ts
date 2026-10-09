import { NextResponse } from 'next/server';
import {
  OPEN_NIZIOLETI_CIVICI,
  OPEN_BELL_TOWERS,
  OPEN_LAGOON_FORTRESS_ISLANDS
} from '@/lib/open-data-catalog';
import { OPEN_WELLS, OSM_POI_META } from '@/lib/osmPoi';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      nizioleti: OPEN_NIZIOLETI_CIVICI,
      wells: OPEN_WELLS,
      bellTowers: OPEN_BELL_TOWERS,
      fortressIslands: OPEN_LAGOON_FORTRESS_ISLANDS
    },
    meta: {
      source: 'Elenco curato da verificare (riferimenti: Venice Project Center, Soprintendenza ABAP); posizioni delle vere da pozzo confrontate con OpenStreetMap (ODbL)',
      osm: OSM_POI_META,
      countNizioleti: OPEN_NIZIOLETI_CIVICI.length,
      countWells: OPEN_WELLS.length,
      countBellTowers: OPEN_BELL_TOWERS.length,
      countFortressIslands: OPEN_LAGOON_FORTRESS_ISLANDS.length,
    }
  });
}
