import { NextResponse } from 'next/server';
import osmWaterways from '@/data/osm-waterways.json';
import { buildSpeedLimits } from '@/lib/waterSpeedLimits';
import { serverSimulation } from '@/server/sources/simulationServer';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { GEOMETRY_MARGIN, MIN_LIMITED_SHARE, ROUNDING_S, scheduleSpeedSegments, type ScheduleSpeedSegment } from '@/lib/scheduleSpeed';
import { compareLines } from '@/lib/serviceNow';
import { PROVIDERS, providerLicense, providersLicense } from '@/lib/provenance/providers';

export const revalidate = 86400;

const LIMITS = buildSpeedLimits(osmWaterways.canals as { id: number; name: string | null; coords: [number, number][] }[]);
let cached: Promise<ScheduleSpeedSegment[] | null> | null = null;

/** Calcolo una volta per istanza: orario e limiti cambiano solo con l'aggiornamento settimanale dei dati. */
function segments(): Promise<ScheduleSpeedSegment[] | null> {
  cached ??= serverSimulation().then((sim) => (sim ? scheduleSpeedSegments(sim.model, ACTV_STOPS_REFERENCE, LIMITS) : null));
  return cached;
}

/**
 * Velocità richiesta dall'orario ACTV sui tratti tra fermate confrontata con i limiti di velocità noti
 * dei canali. Calcolata dall'orario ufficiale: non è una misura della velocità reale dei mezzi.
 */
export async function GET() {
  const data = await segments();
  if (!data) return NextResponse.json({ success: false, data: [], meta: { error: 'orario non disponibile' } }, { status: 503 });
  const sorted = [...data].sort((a, b) => compareLines(a.line, b.line) || a.from.localeCompare(b.from, 'it'));
  const count = (v: ScheduleSpeedSegment['verdict']) => data.filter((s) => s.verdict === v).length;
  return NextResponse.json({
    success: true,
    count: sorted.length,
    data: sorted,
    summary: { tooFast: count('tooFast'), tight: count('tight'), ok: count('ok'), partial: count('partial') },
    meta: {
      kind: 'calculated',
      source: 'Orario ufficiale ACTV (GTFS) e limiti di velocità dagli atti (Regolamento comunale art. 2-3, Ordinanza 93/2007) sui canali OpenStreetMap',
      sourceUrl: PROVIDERS.actvGtfs.url,
      license: `${providersLicense(['actvGtfs', 'osm'])}; limiti: ${providerLicense('speedLimits')}`,
      note: `Calcolo dall'orario, non misura dei mezzi. Tempo minimo legale: somma di lunghezza/limite sui pezzi del tratto in canali con limite noto (limite ACTV se diverso), gli altri pezzi contano zero; il tempo programmato include attracco e partenza. tooFast: orario più breve del minimo legale anche con ${ROUNDING_S} s di tolleranza per gli arrotondamenti e il ${GEOMETRY_MARGIN * 100}% per l'incertezza del percorso; tight: entro il 15%; partial: limite noto su meno del ${MIN_LIMITED_SHARE * 100}% del tratto. Giorno feriale. Non sono inclusi i canali della Capitaneria di Porto (Giudecca, Bacino San Marco).`,
    },
  });
}
