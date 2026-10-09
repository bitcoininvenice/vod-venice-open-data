import { NextResponse } from 'next/server';
import {
  OPEN_LIVE_TRAINS,
  OPEN_VERITAS_WASTE_BOATS
} from '@/lib/open-data-catalog';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      trains: OPEN_LIVE_TRAINS,
      wasteBoats: OPEN_VERITAS_WASTE_BOATS
    },
    meta: {
      kind: 'curated-reference',
      source: 'Elenco curato del progetto, da verificare: treni e battelli Veritas di esempio, non posizioni né ritardi in tempo reale (riferimenti: RFI Viaggiatreno, Gruppo Veritas)',
      countTrains: OPEN_LIVE_TRAINS.length,
      countWasteBoats: OPEN_VERITAS_WASTE_BOATS.length,
    }
  });
}
