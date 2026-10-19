import { NextResponse } from 'next/server';
import { propulsionToday } from '@/server/sources/propulsion';

export const revalidate = 3600;

/**
 * Corse di oggi del trasporto pubblico per alimentazione (elettrica, a motore termico, non nota), contate
 * dagli orari ufficiali. Nessuna stima di CO2: mancano fattori di emissione ufficiali per i mezzi lagunari.
 */
export async function GET() {
  const report = await propulsionToday();
  return NextResponse.json(
    {
      success: true,
      data: report,
      meta: {
        kind: 'computed-indicators',
        source: 'Orari ufficiali: GTFS ACTV, Alilaguna, Trenitalia/Italo (BusOne), ATVO e Dolomiti Bus (PDF), FlixBus',
        note: 'Elettrici: tram, People Mover e treni. A motore termico: vaporetti, motoscafi, motonavi, ferry, Alilaguna e bus extraurbani. Non nota: bus urbani ACTV (flotta mista, l\'orario non dice quale mezzo fa la corsa). Nessuna stima di CO2.',
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
