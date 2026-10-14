import { NextResponse } from 'next/server';
import osmWaterways from '@/data/osm-waterways.json';
import osmToponyms from '@/data/osm-toponyms.json';
import { fetchUpstream } from '@/server/upstream';
import {
  AMBITI,
  ORDINANCES_API,
  ORDINANCES_PAGE,
  attachmentUrl,
  isCityOrIslands,
  italianDate,
  matchCanal,
  matchPlace,
  ordinanceKind,
  ordinanceStatus,
  ordinanceUrl,
  parseOrdinanceDetail,
  parseOrdinanceList,
  parseOrdinancePoints,
  type RawOrdinance,
} from '@/server/sources/comuneOrdinances';
import type { OrdinanceItem, OrdinancesResponse } from '@/lib/contracts/ordinances';
import { romeToday } from '@/lib/time';

// Elenco aggiornato ogni ora; le pagine dei singoli atti restano in cache 6 ore
export const revalidate = 3600;

/** Atti più vecchi di così non vengono letti (le proroghe sono atti nuovi) */
const LOOKBACK_DAYS = 60;
const MAX_PAGES = 8;
const CONCURRENCY = 5;

type Canal = { name: string | null; coords: [number, number][] };
const CANALS = (osmWaterways.canals as unknown as Canal[]).filter((c) => c.name && c.coords.length >= 2);
const CANAL_NAMES = [...new Set(CANALS.map((c) => c.name as string))];
const canalPoint = (name: string): [number, number] | null => {
  const c = CANALS.find((x) => x.name === name);
  return c ? c.coords[Math.floor(c.coords.length / 2)] : null;
};
const TOPONYMS = osmToponyms.names as unknown as Record<string, [number, number][]>;

async function listAmbito(ambito: string, cutoff: string): Promise<RawOrdinance[]> {
  const out: RawOrdinance[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchUpstream(`${ORDINANCES_API}/filtra?numeroPagina=${page}&elementiPerPagina=20&idAmbito=${ambito}`, parseOrdinanceList, { revalidate: 3600, timeoutMs: 8000 });
    if (!res.ok || res.data.length === 0) break;
    out.push(...res.data);
    const oldest = italianDate(res.data[res.data.length - 1].dataRepertorio);
    if (!oldest || oldest < cutoff) break;
  }
  return out;
}

/** Esegue le funzioni con al massimo `n` richieste contemporanee */
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

export async function GET() {
  const today = romeToday();
  const cutoff = new Date(Date.parse(`${today}T12:00:00Z`) - LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);

  const [water, works, roads, traffic, pointsRes] = await Promise.all([
    listAmbito(AMBITI.trafficoAcqueo, cutoff),
    listAmbito(AMBITI.llppVeneziaIsole, cutoff),
    listAmbito(AMBITI.viabilita, cutoff),
    listAmbito(AMBITI.circolazione, cutoff),
    fetchUpstream(ORDINANCES_PAGE, (raw) => parseOrdinancePoints(String(raw)), { responseType: 'text', revalidate: 3600, timeoutMs: 8000 }),
  ]);
  const points = pointsRes.ok ? pointsRes.data : new Map<string, [number, number]>();

  const seen = new Set<string>();
  const all = [...water, ...works, ...roads, ...traffic];
  const candidates = all.filter((o) => {
    const date = italianDate(o.dataRepertorio);
    if (!date || date < cutoff || !isCityOrIslands(o) || seen.has(o.idPratica)) return false;
    seen.add(o.idPratica);
    return true;
  });

  const items = await pool(candidates, CONCURRENCY, async (o): Promise<OrdinanceItem | null> => {
    const detail = await fetchUpstream(
      ordinanceUrl(o.idPratica),
      (raw) => {
        const d = parseOrdinanceDetail(String(raw));
        if (!d) throw new Error('pagina dell\'atto non riconosciuta');
        return d;
      },
      { responseType: 'text', revalidate: 21600, timeoutMs: 8000 },
    );
    const date = italianDate(o.dataRepertorio)!;
    const validFrom = detail.ok ? detail.data.validFrom : null;
    const validTo = detail.ok ? detail.data.validTo : null;
    const status = ordinanceStatus(validFrom, validTo, date, today);
    if (!status) return null;
    const canalName = matchCanal(o.titolo, CANAL_NAMES);
    const comunePoint = points.get(o.idPratica) ?? null;
    const place = comunePoint ? null : matchPlace(o.titolo, o.luogo, TOPONYMS);
    const point = comunePoint ?? place?.point ?? (canalName ? canalPoint(canalName) : null);
    return {
      id: o.idPratica,
      number: o.numeroRepertorio,
      date,
      title: o.titolo.replace(/\s+/g, ' ').trim(),
      ambito: o.ambito,
      luogo: o.luogo,
      validFrom,
      validTo,
      status,
      kind: ordinanceKind(o.titolo),
      canalName,
      placeName: place?.name ?? null,
      lat: point ? point[1] : null,
      lon: point ? point[0] : null,
      positionSource: comunePoint ? 'comune' : place ? 'place' : point ? 'canal' : null,
      url: ordinanceUrl(o.idPratica),
      pdfUrl: detail.ok && detail.data.attachmentId ? attachmentUrl(detail.data.attachmentId) : null,
    };
  });

  const data = items.filter((x): x is OrdinanceItem => x !== null).sort((a, b) => b.date.localeCompare(a.date));
  const body: OrdinancesResponse = {
    success: all.length > 0,
    data,
    meta: {
      source: 'Comune di Venezia – Ordinanze (traffico acqueo; lavori pubblici Venezia e isole; viabilità; circolazione)',
      sourceUrl: ORDINANCES_PAGE,
      fetchedAt: new Date().toISOString(),
      note: 'Atti in vigore o in arrivo nei prossimi 7 giorni, dalle pagine ufficiali del Comune. Fa fede il testo dell\'ordinanza. Posizione: dalla mappa del Comune, altrimenti dal luogo o dal canale citati nel titolo e trovati su OpenStreetMap (indicativa).',
    },
  };
  return NextResponse.json(body);
}
