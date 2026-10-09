import { NextResponse } from 'next/server';
import {
  OPEN_HEAT_ISLAND_LST
} from '@/lib/open-data-catalog';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      heatIslands: OPEN_HEAT_ISLAND_LST
    },
    meta: {
      kind: 'curated-reference',
      source: 'Elenco curato del progetto con temperature di esempio, da verificare (riferimenti: Copernicus LST, Sentinel-3 SLSTR, Landsat TIRS). Non sono misure satellitari scaricate.',
      countHeatZones: OPEN_HEAT_ISLAND_LST.length,
    }
  });
}
