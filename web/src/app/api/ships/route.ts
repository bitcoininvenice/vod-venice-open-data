import { NextResponse } from 'next/server';
import { MARITIME_ROUTES } from '@/lib/shipsData';
import { AIS_SOURCE, getShipsSnapshot } from '@/server/sources/aisstream';

// Si rigenera al massimo ogni minuto; il modulo AIS limita comunque i collegamenti
export const revalidate = 60;
export const maxDuration = 30;

export async function GET() {
  const snap = await getShipsSnapshot();
  return NextResponse.json({
    success: true,
    totalShips: snap.ships.length,
    regulationNotice: 'Decreto Legge 103/2021: navi passeggeri oltre 25.000 GT instradate a Marghera via Canale dei Petroli; vietato il transito nel Bacino di San Marco e nel Canale della Giudecca.',
    meta: {
      kind: snap.configured ? 'live' : 'not-configured',
      source: AIS_SOURCE,
      sourceUrl: 'https://aisstream.io',
      license: 'Messaggi AIS trasmessi pubblicamente dalle navi, ricevuti tramite aisstream.io',
      usage: 'Dati per la sola visualizzazione nella mappa di VOD (progetto senza fini di lucro): non ridistribuire. Per altri usi vedere i termini di aisstream.io.',
      collectedAt: snap.collectedAt,
      messagesLastCollection: snap.messages,
      error: snap.error,
      note: 'Navi sentite via AIS negli ultimi 30 minuti, con l’ora dell’ultimo segnale. La copertura dipende dai ricevitori a terra: alcune navi possono mancare. Non usare per la navigazione.',
    },
    routes: MARITIME_ROUTES,
    data: snap.ships,
  });
}
