import { NextResponse } from 'next/server';
import index from '@/data/actv-gtfs-index.json';
import { fetchUpstream } from '@/server/upstream';
import { isCurrent, parseRss, toNotice } from '@/server/sources/actvNotices';
import { ACTV_INFOMOBILITY_PAGE, ACTV_RSS_URL, type ActvNoticesResponse } from '@/lib/contracts/actvNotices';
import { romeToday } from '@/lib/time';

export const revalidate = 900;

const IDX = index as unknown as { routes: Record<string, { n: string }>; stops: Record<string, [string, number, number]> };
const LINES = new Set(Object.values(IDX.routes).map((r) => r.n.toUpperCase()));

/** Avvisi di servizio ACTV in corso o recenti, dal feed RSS ufficiale (riletto ogni 15 minuti). */
export async function GET() {
  const res = await fetchUpstream(ACTV_RSS_URL, (raw) => parseRss(String(raw)), { responseType: 'text', revalidate: 900, timeoutMs: 8000 });
  const today = romeToday();
  const data = res.ok ? res.data.map((i) => toNotice(i, IDX.stops, LINES)).filter((n) => isCurrent(n, today)) : [];
  const body: ActvNoticesResponse = {
    success: res.ok,
    data,
    meta: {
      source: 'ACTV / AVM S.p.A. – avvisi di infomobilità (feed RSS)',
      sourceUrl: ACTV_INFOMOBILITY_PAGE,
      fetchedAt: new Date().toISOString(),
      note: 'Ultimi avvisi del feed RSS di ACTV, senza quelli già conclusi secondo le date citate nel testo. Fermate ricavate dal codice "ID" o dal nome citato, linee riconosciute nell\'orario: indicazioni automatiche, fa fede l\'avviso di ACTV.',
    },
  };
  return NextResponse.json(body, { status: res.ok ? 200 : 503 });
}
