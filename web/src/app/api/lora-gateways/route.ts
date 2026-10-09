import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { PACKET_BROKER_SITE, PACKET_BROKER_SOURCE, PACKET_BROKER_URL, parseGateways } from '@/server/sources/packetBroker';

// Lo stato dei gateway cambia di rado: una lettura ogni 10 minuti (il Mapper chiede di usare la cache)
export const revalidate = 600;

export async function GET() {
  const res = await fetchUpstream(PACKET_BROKER_URL, parseGateways, { revalidate: 600, timeoutMs: 8000 });
  return NextResponse.json(
    {
      success: res.ok,
      count: res.ok ? res.data.length : 0,
      data: res.ok ? res.data : [],
      meta: {
        kind: res.ok ? 'live' : 'unavailable',
        source: PACKET_BROKER_SOURCE,
        sourceUrl: PACKET_BROKER_SITE,
        license: 'Dati pubblicati volontariamente dai proprietari dei gateway tramite Packet Broker (The Things Network)',
        fetchedAt: res.ok ? res.fetchedAt : null,
        error: res.ok ? undefined : res.error,
        note: 'Solo i gateway online nell’area della mappa, con stato e posizione resi pubblici dai proprietari. Posizione arrotondata a circa 100 m e nessun identificativo, per riservatezza. La copertura radio reale non è indicata.',
      },
    },
    { status: res.ok ? 200 : 503 }
  );
}
