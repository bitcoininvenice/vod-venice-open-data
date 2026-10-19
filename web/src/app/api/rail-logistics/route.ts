import { NextResponse } from 'next/server';
import { OPEN_VERITAS_WASTE_BOATS } from '@/lib/open-data-catalog';
import { fetchLiveTrainsInVenice, fetchStationBoard } from '@/server/sources/busoneTrains';
import { providerMeta } from '@/lib/provenance/providers';

export const revalidate = 20;

export async function GET() {
  const [trainsResult, santaLuciaBoard, mestreBoard] = await Promise.all([
    fetchLiveTrainsInVenice(),
    fetchStationBoard('santa_lucia'),
    fetchStationBoard('mestre'),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      trains: trainsResult.trains,
      wasteBoats: OPEN_VERITAS_WASTE_BOATS,
      stationBoards: {
        santaLucia: santaLuciaBoard,
        mestre: mestreBoard,
      },
    },
    meta: {
      kind: 'live',
      liveAvailable: trainsResult.ok,
      ...providerMeta('busone', 'BusOne (https://busone.app) – Trenitalia & Italo GTFS-RT'),
      countTrains: trainsResult.trains.length,
      countWasteBoats: OPEN_VERITAS_WASTE_BOATS.length,
      note: 'Treni in circolazione nell\'area di Venezia (Trenitalia e Italo, posizioni del feed in tempo reale) e tabellone dei prossimi 90 minuti a Santa Lucia e Mestre dall\'orario ufficiale (NeTEx Trenitalia del Punto di Accesso Nazionale e Italo) con i ritardi del feed. Dati via BusOne, uso non commerciale con citazione. Senza feed nessun treno: niente treni di esempio.',
    },
  });
}
