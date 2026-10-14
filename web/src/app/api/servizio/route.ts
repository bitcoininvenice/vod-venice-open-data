import { NextResponse } from 'next/server';
import { GET as vehiclesGET, type RealtimeVehicleOut } from '@/app/api/realtime/vehicles/route';
import { serverSimulation } from '@/server/sources/simulationServer';
import { matchTrip, parseGtfsTime, fromGrid } from '@/lib/positionDelay';
import { pointAt, type SimProfile } from '@/lib/simulationCore';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { romeDayType, romeLocalToDate, romeSecondsOfDay } from '@/lib/time';
import { scheduledRunning, serviceNow, type ServiceVehicle } from '@/lib/serviceNow';

export const revalidate = 30;

const terminusCache = new WeakMap<SimProfile, string>();

/** Destinazione di una corsa: la fermata della mappa più vicina all'ultimo punto del percorso. */
function terminusOf(p: SimProfile): string {
  const cached = terminusCache.get(p);
  if (cached) return cached;
  const pt: [number, number] = [0, 0];
  pointAt(p.sh, p.Dd[p.Dd.length - 1], pt);
  const [lon, lat] = fromGrid(pt[0], pt[1]);
  const k = Math.cos((lat * Math.PI) / 180) * 111320;
  let best: { d: number; name: string } | null = null;
  for (const s of ACTV_STOPS_REFERENCE) {
    const d = Math.hypot((s.lon - lon) * k, (s.lat - lat) * 110540);
    if (d <= 300 && (!best || d < best.d)) best = { d, name: s.name };
  }
  const name = best?.name ?? `${lon.toFixed(3)},${lat.toFixed(3)}`;
  terminusCache.set(p, name);
  return name;
}

/**
 * Servizio ACTV adesso (nessuno storico): per linea ritardo dei mezzi GPS, corse in servizio secondo
 * l'orario senza posizione nel feed, mezzi in coda. Ricalcolato ogni 30 s dai dati in tempo reale.
 */
export async function GET() {
  const [vehiclesRes, sim] = await Promise.all([vehiclesGET(), serverSimulation()]);
  const body = (await vehiclesRes.json()) as { ok: boolean; data: RealtimeVehicleOut[]; meta: { feeds: { navigazione: boolean; automobilistico: boolean }; fetchedAt?: string } };
  const now = new Date();
  const day = romeDayType(now);

  const vehicles: ServiceVehicle[] = body.data.map((v) => {
    const departure = parseGtfsTime(v.startTime);
    let terminus: string | null = null;
    if (sim && v.line && departure !== null) {
      const d = v.startDate && /^\d{8}$/.test(v.startDate)
        ? romeDayType(romeLocalToDate(`${v.startDate.slice(0, 4)}-${v.startDate.slice(4, 6)}-${v.startDate.slice(6, 8)} 12:00:00`))
        : day;
      const trip = matchTrip(sim.index, v.line, departure, d, v.network);
      if (trip) terminus = terminusOf(trip.profile);
    }
    return { id: v.id, line: v.line, network: v.network, departure, terminus, delaySeconds: v.delay?.seconds ?? null };
  });

  const yesterday = romeDayType(new Date(now.getTime() - 86400_000));
  const running = sim ? scheduledRunning(sim.model, day, romeSecondsOfDay(now), yesterday) : new Map();
  const data = body.ok ? serviceNow(vehicles, running, body.meta.feeds) : [];

  return NextResponse.json({
    success: body.ok,
    count: data.length,
    data,
    meta: {
      kind: 'live',
      source: 'ACTV / AVM – GTFS-Realtime e orario ufficiale GTFS',
      sourceUrl: 'https://tpl.actv.it',
      fetchedAt: body.meta.fetchedAt ?? null,
      computedAt: now.toISOString(),
      timetable: sim !== null,
      note: 'Situazione di adesso, senza storico. Ritardo: solo mezzi GPS con ritardo verificato (puntuale = tra −1 e +3 min). Corse senza GPS: corse in servizio secondo l\'orario meno i mezzi della linea visibili nel feed; è un indizio, non la prova di una soppressione (un mezzo può viaggiare senza trasmettere la posizione). Mezzi in coda: due corse consecutive della stessa linea e direzione, programmate ad almeno 6 minuti, che adesso distano meno di 4 minuti e di un terzo dell\'intervallo. Licenza del feed realtime da confermare con AVM S.p.A.',
    },
  });
}
