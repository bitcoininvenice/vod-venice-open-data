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
      source: 'Copernicus Land Monitoring Service (LST), Sentinel-3 SLSTR, Landsat-9 TIRS',
      countHeatZones: OPEN_HEAT_ISLAND_LST.length,
    }
  });
}
