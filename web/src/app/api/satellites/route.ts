import { NextResponse } from 'next/server';
import { SATELLITES_DATA } from '@/lib/satellitesData';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    source: 'Copernicus Data Space Ecosystem (ESA) / ASI Open Data / CelesTrak NORAD',
    targetLocation: 'Laguna di Venezia (Lat 45.438, Lon 12.335)',
    count: SATELLITES_DATA.length,
    data: SATELLITES_DATA
  });
}
