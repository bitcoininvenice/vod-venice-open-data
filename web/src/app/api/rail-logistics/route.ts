import { NextResponse } from 'next/server';
import {
  OPEN_LIVE_TRAINS,
  OPEN_VERITAS_WASTE_BOATS
} from '@/lib/open-data-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      trains: OPEN_LIVE_TRAINS,
      wasteBoats: OPEN_VERITAS_WASTE_BOATS
    },
    meta: {
      source: 'Viaggiatreno / Rete Ferroviaria Italiana (RFI), Gruppo Veritas SpA',
      countTrains: OPEN_LIVE_TRAINS.length,
      countWasteBoats: OPEN_VERITAS_WASTE_BOATS.length,
      updatedAt: new Date().toISOString()
    }
  });
}
