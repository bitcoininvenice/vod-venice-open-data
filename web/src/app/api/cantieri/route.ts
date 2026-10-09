import { NextResponse } from 'next/server';
import { fetchCantieri, OPERE_PUBBLICHE_META } from '@/lib/db';
import bdapData from '@/data/bdap-opere-venezia.json';
import type { BdapDataset } from '@/lib/bdap';

const bdap = bdapData as unknown as BdapDataset;
const BDAP_BY_CUP = new Map(bdap.projects.filter((p) => p.inElenco).map((p) => [p.cup, { ...p, observedAt: bdap.observedAt }]));

export const revalidate = 86400;

export async function GET() {
  // Arricchimento per CUP con il Monitoraggio Opere Pubbliche (BDAP): fase reale, date, costi e finanziamenti
  const cantieri = (await fetchCantieri()).map((c) => ({ ...c, bdap: (c.cup && BDAP_BY_CUP.get(c.cup)) || null }));
  const linked = cantieri.filter((c) => c.bdap).length;
  return NextResponse.json({
    success: true,
    count: cantieri.length,
    data: cantieri,
    meta: {
      kind: 'static-reference',
      source: OPERE_PUBBLICHE_META.source,
      sourceUrl: OPERE_PUBBLICHE_META.sourceUrl,
      license: OPERE_PUBBLICHE_META.license,
      observedAt: OPERE_PUBBLICHE_META.generatedAt,
      note: `${OPERE_PUBBLICHE_META.located}/${OPERE_PUBBLICHE_META.count} opere con posizione approssimata (${OPERE_PUBBLICHE_META.geocoding}). Aggiornamento con pipeline/import_opere_pubbliche.py.`,
      bdap: {
        linked,
        source: bdap.source,
        sourceUrl: bdap.sourceUrl,
        license: bdap.license,
        observedAt: bdap.observedAt,
        note: `${linked} opere collegate per CUP al Monitoraggio Opere Pubbliche (campo "bdap"): fase, date effettive, costi e finanziamenti.`,
      },
    },
  });
}
