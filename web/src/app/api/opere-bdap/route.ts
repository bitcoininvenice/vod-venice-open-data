import { NextResponse } from 'next/server';
import data from '@/data/bdap-opere-venezia.json';
import type { BdapDataset } from '@/lib/bdap';

export const revalidate = 86400;

const ds = data as unknown as BdapDataset;

/**
 * Opere pubbliche del Comune di Venezia in esecuzione secondo il Monitoraggio Opere Pubbliche (BDAP),
 * più il riepilogo di tutti i progetti del Comune per fase, settore e fonte di finanziamento.
 */
export async function GET() {
  const inProgress = ds.projects.filter((p) => p.inProgress).map((p) => ({ ...p, observedAt: ds.observedAt }));
  return NextResponse.json({
    success: true,
    count: inProgress.length,
    data: inProgress,
    summary: ds.summary,
    meta: {
      kind: 'static-reference',
      source: ds.source,
      sourceUrl: ds.sourceUrl,
      license: ds.license,
      observedAt: ds.observedAt,
      retrievedAt: ds.generatedAt,
      titolare: ds.titolare,
      located: ds.located,
      geocoding: ds.geocoding,
      note: `${ds.located}/${inProgress.length} opere in esecuzione con posizione approssimata (luogo citato nel CUP). Le altre indicano luoghi generici (es. "municipalità diverse"). Aggiornamento con pipeline/import_bdap_opere.py.`,
    },
  });
}
