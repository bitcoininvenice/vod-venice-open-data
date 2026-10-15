import 'server-only';
import { serverSimulation } from '@/server/sources/simulationServer';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { planTrip, type Itinerary, type Leg, type PlanMode } from '@/lib/tripPlanner';
import { FIRST_SERVICE_FROM_S, isAirport, planAirportOrTomorrow } from '@/lib/airportPlanner';
import { planBoat, ASSUMED_KMH } from '@/lib/boatRouting';
import { nextScheduledDeparture, scheduledDepartures } from '@/lib/scheduledDepartures';
import { alilagunaTripsOn, ALILAGUNA_STOPS } from '@/lib/alilaguna-schedule';
import { getFloodedGroundPercentage, getSirenTones } from '@/lib/flood';
import { MOSE_THRESHOLD_CM } from '@/lib/tideCurve';
import { PASSERELLE_ROUTES } from '@/lib/passerelleData';
import { metersBetween, nearestNode } from '@/lib/walkGraph';
import { isMainland } from '@/lib/streetElevation';
import { findStops, resolvePlace, stopsNear, type ResolvedPlace } from './places';
import { hhmm, serverBoatGraph, serverWalkGraph, SOURCES, tideToday, tripContext, VOD_BASE_URL, type SourceRef, type TripContext } from './context';

export type ServiceResult = { ok: true; body: Record<string, unknown> } | { ok: false; status: number; error: string; message: string };

const fail = (status: number, error: string, message: string): ServiceResult => ({ ok: false, status, error, message });

const minutes = (s: number) => Math.max(1, Math.round(s / 60));

/** Un tratto dell'itinerario in forma leggibile per una persona o un'AI */
function legOut(l: Leg) {
  if (l.kind === 'walk') return { type: 'a_piedi', from: l.from, to: l.to, start: hhmm(l.start), end: hhmm(l.end), minutes: minutes(l.seconds), meters: Math.round(l.meters), ...(l.wetMeters >= 10 ? { wetMeters: Math.round(l.wetMeters), maxDepthCm: l.maxDepthCm } : {}) };
  if (l.kind === 'boat') return { type: 'barca_privata', from: l.from, to: l.to, start: hhmm(l.start), end: hhmm(l.end), minutes: minutes(l.seconds), meters: Math.round(l.meters) };
  return {
    type: 'mezzo',
    operator: l.operator === 'alilaguna' ? 'Alilaguna' : 'ACTV',
    line: l.line,
    category: l.category,
    direction: l.headsign,
    from: l.from,
    to: l.to,
    start: hhmm(l.start),
    end: hhmm(l.end),
    stops: l.stops,
  };
}

function itineraryOut(it: Itinerary) {
  const rides = it.legs.filter((l) => l.kind === 'ride');
  return {
    depart: hhmm(it.depart),
    arrive: hhmm(it.arrive),
    minutes: minutes(it.arrive - it.depart),
    vehicles: it.rides,
    changes: Math.max(0, it.rides - 1),
    lines: rides.map((l) => (l.kind === 'ride' ? `${l.operator === 'alilaguna' ? 'Alilaguna ' : ''}${l.line}` : '')),
    walkMeters: Math.round(it.walkMeters),
    ...(it.via ? { option: it.via === 'alilaguna' ? 'Alilaguna via acqua' : it.via === 'actv' ? 'ACTV con il bus 5 da Piazzale Roma' : 'altri mezzi' } : {}),
    ...(it.wetMeters >= 10 ? { wetMeters: Math.round(it.wetMeters), maxDepthCm: it.maxDepthCm } : {}),
    ...(it.hurry
      ? {
          hurry: `Sbrigati: ${it.hurry.line} parte da ${it.hurry.stop} alle ${hhmm(it.hurry.departs)}; a piedi al passo normale servono circa ${minutes(it.hurry.walkSeconds)} min.`,
        }
      : {}),
    ...(it.ridesInHighWater ? { warning: 'Marea da +110 cm: ACTV può deviare o ridurre alcune linee rispetto all\'orario.' } : {}),
    legs: it.legs.map(legOut),
  };
}

function placeOut(p: ResolvedPlace) {
  return { label: p.label, lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6), kind: p.kind, approximate: p.approximate, source: p.source };
}

/** Link a VOD con il planner già compilato */
function plannerUrl(from: ResolvedPlace, to: ResolvedPlace, ctx: TripContext, mode: PlanMode): string {
  const q = new URLSearchParams({
    open: 'planner',
    da: `${from.lat.toFixed(5)},${from.lon.toFixed(5)}`,
    daNome: from.label,
    a: `${to.lat.toFixed(5)},${to.lon.toFixed(5)}`,
    aNome: to.label,
    ...(ctx.isNow ? {} : { ora: ctx.timeLabel }),
    ...(mode !== 'fastest' ? { modo: mode } : {}),
  });
  return `${VOD_BASE_URL}/?${q.toString()}`;
}

/** Fonti usate davvero da un itinerario */
function itinerarySources(its: Itinerary[], tideUsed: boolean): SourceRef[] {
  const out: SourceRef[] = [SOURCES.osm];
  const legs = its.flatMap((i) => i.legs);
  if (legs.some((l) => l.kind === 'ride' && l.operator !== 'alilaguna')) out.push(SOURCES.actv);
  if (legs.some((l) => l.kind === 'ride' && l.operator === 'alilaguna')) out.push(SOURCES.alilaguna);
  if (tideUsed) out.push(SOURCES.cpsm, SOURCES.passerelle);
  out.push(SOURCES.vod);
  return out;
}

export interface PlanInput {
  from: string;
  to: string;
  date?: string | null;
  time?: string | null;
  mode?: 'fastest' | 'walk' | 'water' | 'private';
  resident?: boolean;
  /** livello di marea da simulare (cm): sostituisce misura e previsione */
  tideCm?: number | null;
}

/** «Come arrivare» lato server: stesso motore della pagina, risposta con fonti e link a VOD. */
export async function planTripService(input: PlanInput): Promise<ServiceResult> {
  const from = resolvePlace(input.from);
  const to = resolvePlace(input.to);
  if (!from) return fail(404, 'place_not_found', `Luogo di partenza non trovato: «${input.from}». Usa una fermata, un indirizzo, un civico (es. Cannaregio 3450) o «lat,lon».`);
  if (!to) return fail(404, 'place_not_found', `Luogo di arrivo non trovato: «${input.to}».`);
  const ctx = tripContext(input.date, input.time);
  if ('error' in ctx) return fail(400, 'invalid_time', ctx.error);
  const mode: PlanMode = input.mode === 'walk' ? 'walk' : input.mode === 'water' ? 'boat' : input.mode === 'private' ? 'private' : 'fastest';

  const caveat =
    'Orari teorici degli orari ufficiali, senza ritardi, affollamento né variazioni del servizio; biglietti ACTV e Alilaguna separati. Verifica sempre sul posto.';

  if (mode === 'private') {
    const boat = await serverBoatGraph();
    if (!boat) return fail(503, 'unavailable', 'Rete dei canali non disponibile in questo momento.');
    const tideCm = input.tideCm ?? (ctx.isNow ? ((await tideToday())?.measuredCm ?? null) : null);
    const r = planBoat(boat, from, to, ctx.seconds, ctx.day, { resident: !!input.resident, tideCm });
    const sources = [SOURCES.osmCanals, SOURCES.testoUnico, SOURCES.speedLimits, ...(tideCm !== null ? [SOURCES.cpsm] : []), SOURCES.vod];
    if (!r.ok) {
      const why = {
        farFromWater: 'Partenza o arrivo troppo lontani da un canale (oltre 250 m).',
        restricted: input.resident
          ? 'In questo momento non ci sono canali percorribili vicino alla partenza o all\'arrivo (divieti o marea).'
          : 'Partenza o arrivo dentro la ZTL: senza residenza o concessione la barca da diporto non può circolare nei rii e nel Canal Grande (art. 18 del Testo Unico).',
        noRoute: 'Nessun percorso in barca rispetta sensi unici e divieti in vigore a quest\'ora.',
      }[r.reason];
      return { ok: true, body: { from: placeOut(from), to: placeOut(to), mode: 'private', found: false, message: why, sources, vodUrl: plannerUrl(from, to, ctx, mode) } };
    }
    const p = r.plan;
    return {
      ok: true,
      body: {
        from: placeOut(from),
        to: placeOut(to),
        mode: 'private',
        resident: !!input.resident,
        date: ctx.dateLabel,
        found: true,
        depart: hhmm(p.depart),
        arrive: hhmm(p.arrive),
        minutesAtLeast: minutes(p.arrive - p.depart),
        km: +(p.meters / 1000).toFixed(1),
        canals: p.stretches.filter((s) => s.meters >= 30).map((s) => ({ name: s.name ?? 'canale senza nome su OpenStreetMap', meters: Math.round(s.meters) })),
        routeChangedFor: p.avoided.map((x) => `${x.label} (${x.ref})`),
        rulesOnRoute: p.onRoute.map((x) => `${x.label} (${x.ref})`),
        tideRule: p.tideRule,
        speedNote: `Tempo al limite di velocità di ogni canale; per ${(p.assumedMeters / 1000).toFixed(1)} km il limite non è noto (ipotizzati ${ASSUMED_KMH} km/h).`,
        caveat:
          'Percorso indicativo, non valido per la navigazione: fanno fede il Testo Unico della circolazione acquea, le ordinanze temporanee e la segnaletica. Non considera ponti, larghezza e pescaggio della barca, deroghe per categoria né i canali della Capitaneria di Porto.',
        sources,
        vodUrl: plannerUrl(from, to, ctx, mode),
      },
    };
  }

  const [graph, sim] = await Promise.all([serverWalkGraph(), serverSimulation()]);
  if (!graph || !sim) return fail(503, 'unavailable', 'Orario o rete pedonale non disponibili in questo momento.');
  // Marea: quella simulata se indicata, altrimenti misura e previsione CPSM (solo per oggi)
  const today = tripContext() as TripContext;
  const tide = input.tideCm == null && ctx.dateLabel === today.dateLabel ? await tideToday() : null;
  const tideAt = input.tideCm != null ? () => input.tideCm as number : tide?.at;
  const options = { mode, tideAt, passerelle: PASSERELLE_ROUTES, nextDay: ctx.nextDay, hurry: ctx.isNow, date: ctx.date };

  const base = { from: placeOut(from), to: placeOut(to), date: ctx.dateLabel, time: ctx.timeLabel, mode: input.mode ?? 'fastest', caveat, vodUrl: plannerUrl(from, to, ctx, mode) };

  // Aeroporto: Alilaguna, ACTV con il bus 5, altri mezzi; di notte le prime soluzioni di domani
  if (mode !== 'walk' && isAirport(from) !== isAirport(to)) {
    const r = planAirportOrTomorrow(graph, sim.model, ACTV_STOPS_REFERENCE, from, to, ctx.seconds, ctx.day, { day: ctx.nextDay, date: ctx.nextDate }, options);
    return {
      ok: true,
      body: {
        ...base,
        found: r.options.length > 0,
        tomorrowMorning: r.tomorrow,
        ...(r.tomorrow && r.lastBus !== null ? { note: `L'ultimo bus 5 della serata parte alle ${hhmm(r.lastBus)}, ma da questo punto non si arriva in tempo: soluzioni di domani mattina.` } : {}),
        itineraries: r.options.map(itineraryOut),
        ...(r.ifLate ? { ifYouMissIt: { tomorrowMorning: r.ifLateTomorrow, ...itineraryOut(r.ifLate) } } : {}),
        sources: itinerarySources(r.options, !!tideAt),
      },
    };
  }

  let plan = planTrip(graph, sim.model, ACTV_STOPS_REFERENCE, from, to, ctx.seconds, ctx.day, options);
  let tomorrow = false;
  if (!plan.best && mode !== 'walk') {
    const morning = planTrip(graph, sim.model, ACTV_STOPS_REFERENCE, from, to, FIRST_SERVICE_FROM_S, ctx.nextDay, { mode, passerelle: PASSERELLE_ROUTES, date: ctx.nextDate });
    if (morning.best) {
      plan = morning;
      tomorrow = true;
    }
  }
  if (!plan.best) {
    return {
      ok: true,
      body: {
        ...base,
        found: false,
        message:
          'Nessun percorso trovato entro 3 ore, nemmeno domani mattina: uno dei due punti è lontano dalla rete pedonale (da Chioggia a Mestre e all\'aeroporto) o dalle fermate.',
        sources: [SOURCES.osm, SOURCES.actv, SOURCES.vod],
      },
    };
  }
  const alternatives = plan.alternatives && plan.alternatives.length > 0 ? plan.alternatives : [plan.best];
  return {
    ok: true,
    body: {
      ...base,
      found: true,
      tomorrowMorning: tomorrow,
      itineraries: alternatives.map(itineraryOut),
      ...(plan.walkOnly && plan.best.rides > 0 ? { walkOnly: { minutes: minutes(plan.walkOnly.arrive - plan.walkOnly.depart), meters: Math.round(plan.walkOnly.walkMeters) } } : {}),
      ...(plan.ifLate ? { ifYouMissIt: itineraryOut(plan.ifLate) } : {}),
      ...(plan.floodLevelCm != null
        ? { highWater: { levelCm: plan.floodLevelCm, note: 'Percorso scelto per restare il più possibile all\'asciutto: quote delle calli stimate, tracciati delle passerelle indicativi.' } }
        : {}),
      sources: itinerarySources(alternatives, plan.floodLevelCm != null),
    },
  };
}

export interface DeparturesInput {
  stop: string;
  date?: string | null;
  time?: string | null;
  /** finestra in minuti (max 240) */
  minutes?: number;
}

/** Prossime partenze dall'orario ufficiale (ACTV e Alilaguna) da una fermata, con la prossima corsa se non ce ne sono. */
export async function departuresService(input: DeparturesInput): Promise<ServiceResult> {
  const place = resolvePlace(input.stop);
  if (!place) return fail(404, 'place_not_found', `Fermata o luogo non trovato: «${input.stop}».`);
  const ctx = tripContext(input.date, input.time);
  if ('error' in ctx) return fail(400, 'invalid_time', ctx.error);
  const windowMin = Math.min(240, Math.max(10, input.minutes ?? 90));
  const sim = await serverSimulation();
  if (!sim) return fail(503, 'unavailable', 'Orario non disponibile in questo momento.');

  // Fermate entro 150 m dal luogo (pontili, corsie bus, darsene Alilaguna dello stesso nodo)
  // fermate ACTV entro 150 m (pontili, corsie bus, tram dello stesso nodo); le darsene Alilaguna sono a parte
  const near = stopsNear(place.lat, place.lon).filter((s, i, arr) => s.operator === 'ACTV' && arr.findIndex((x) => x.name === s.name && x.operator === 'ACTV') === i);
  const points = near.length > 0 ? near : [{ name: place.label, lat: place.lat, lon: place.lon }];
  const seen = new Set<string>();
  const departures: { time: string; operator: string; line: string; category: string; direction: string; stop: string; seconds: number }[] = [];
  for (const p of points) {
    for (const d of scheduledDepartures(sim.model, p, ctx.day, ctx.seconds, windowMin * 60, ctx.nextDay)) {
      const key = `${d.line}|${d.time}|${d.headsign}`;
      if (seen.has(key)) continue;
      seen.add(key);
      departures.push({ time: hhmm(d.time), operator: 'ACTV', line: d.line, category: d.category, direction: d.headsign, stop: p.name, seconds: d.time });
    }
  }
  let alilagunaUsed = false;
  // la darsena Alilaguna dell'aeroporto è a circa 450 m dal terminal (percorso coperto)
  const dockRadius = place.kind === 'airport' ? 600 : 150;
  const docks = new Set(ALILAGUNA_STOPS.map((s, i) => (metersBetween(s.lon, s.lat, place.lon, place.lat) <= dockRadius ? i : -1)).filter((i) => i >= 0));
  if (docks.size > 0) {
    for (const trip of alilagunaTripsOn(ctx.date)) {
      trip.stops.forEach((s, i) => {
        if (!docks.has(s.stop) || i === trip.stops.length - 1 || s.dep < ctx.seconds || s.dep > ctx.seconds + windowMin * 60) return;
        alilagunaUsed = true;
        departures.push({ time: hhmm(s.dep), operator: 'Alilaguna', line: trip.line.replace(/^Linea\s+/i, ''), category: 'alilaguna', direction: trip.headsign.replace(/^per\s+/i, ''), stop: ALILAGUNA_STOPS[s.stop].name, seconds: s.dep });
      });
    }
  }
  departures.sort((a, b) => a.seconds - b.seconds);
  let nextRun: Record<string, unknown> | null = null;
  if (departures.length === 0) {
    const next = points.map((p) => nextScheduledDeparture(sim.model, p, ctx.day, ctx.nextDay, ctx.seconds)).filter((x) => x !== null).sort((a, b) => a!.time + (a!.tomorrow && a!.time < 86400 ? 86400 : 0) - (b!.time + (b!.tomorrow && b!.time < 86400 ? 86400 : 0)))[0];
    if (next) nextRun = { time: hhmm(next.time), tomorrow: next.tomorrow, line: next.line, direction: next.headsign };
  }
  return {
    ok: true,
    body: {
      place: placeOut(place),
      stops: points.map((p) => p.name),
      date: ctx.dateLabel,
      from: ctx.timeLabel,
      windowMinutes: windowMin,
      departures: departures.slice(0, 60).map((d) => ({ time: d.time, operator: d.operator, line: d.line, category: d.category, direction: d.direction, stop: d.stop })),
      ...(nextRun ? { nextRun } : {}),
      caveat: 'Orario teorico ufficiale, senza ritardi: per i ritardi in tempo reale c\'è il dataset realtime_vehicles e la scheda della fermata su VOD.',
      sources: [SOURCES.actv, ...(alilagunaUsed ? [SOURCES.alilaguna] : []), SOURCES.vod],
      vodUrl: `${VOD_BASE_URL}/?${new URLSearchParams({ open: 'search', q: place.label }).toString()}`,
    },
  };
}

export interface FloodInput {
  /** livello da simulare (cm sullo zero di Punta della Salute); se manca, misura e previsione attuali */
  levelCm?: number | null;
  place?: string | null;
  from?: string | null;
  to?: string | null;
}

/** Simulatore di acqua alta: città allagata, sirene, MOSE, un luogo e un percorso a piedi all'asciutto. */
export async function floodService(input: FloodInput): Promise<ServiceResult> {
  const tide = input.levelCm == null ? await tideToday() : null;
  const level = input.levelCm ?? tide?.measuredCm ?? null;
  if (level == null) return fail(503, 'unavailable', 'Marea non disponibile: indica un livello da simulare (levelCm).');
  if (level < -100 || level > 250) return fail(400, 'invalid_level', 'Livello fuori scala: tra −100 e +250 cm.');
  const activePasserelle = PASSERELLE_ROUTES.filter((p) => level >= p.activationThresholdCm);
  const body: Record<string, unknown> = {
    levelCm: level,
    basis: input.levelCm != null ? 'simulato' : 'misurato (Punta della Salute)',
    ...(tide?.observedAt ? { observedAt: tide.observedAt } : {}),
    floodedHistoricCentrePercent: getFloodedGroundPercentage(level),
    sirenTones: getSirenTones(level),
    mose:
      level >= MOSE_THRESHOLD_CM
        ? 'Con una previsione da +110 cm il MOSE di norma si alza e in città la marea resta più bassa: questi valori descrivono l\'evento senza MOSE.'
        : 'Sotto +110 cm il MOSE di norma non si alza.',
    passerelle: { active: activePasserelle.length, meters: Math.round(activePasserelle.reduce((s, p) => s + p.lengthMeters, 0)) },
    ...(tide?.forecast ? { forecastExtremes: tide.forecast.extremes.slice(0, 6), forecastIssuedAt: tide.forecast.issuedAt } : {}),
  };
  const sources: SourceRef[] = [SOURCES.cpsm, SOURCES.passerelle];
  if (input.place) {
    const p = resolvePlace(input.place);
    if (!p) return fail(404, 'place_not_found', `Luogo non trovato: «${input.place}».`);
    const graph = await serverWalkGraph();
    if (graph) {
      const n = nearestNode(graph, p.lon, p.lat);
      let elev: number | null = null;
      for (let k = graph.off[n.node]; k < graph.off[n.node + 1]; k++) {
        const e = graph.adjEdge[k];
        if (graph.edgeFlags[e] === 0) elev = elev === null ? graph.edgeElev[e] : Math.min(elev, graph.edgeElev[e]);
      }
      body.place = {
        ...placeOut(p),
        ...(isMainland(p.lon, p.lat) || elev === null
          ? { note: 'Fuori dal modello dell\'acqua alta della città (terraferma o ponte).' }
          : { estimatedGroundCm: elev, wet: level > elev, depthCm: Math.max(0, level - elev) }),
      };
      sources.push(SOURCES.osm);
    }
  }
  if (input.from && input.to) {
    const r = await planTripService({ from: input.from, to: input.to, mode: 'walk', tideCm: level });
    if (r.ok) body.walkingRoute = { itinerary: (r.body.itineraries as unknown[] | undefined)?.[0] ?? null, highWater: r.body.highWater ?? null, vodUrl: r.body.vodUrl };
  }
  body.caveat =
    'Stima: la percentuale di città allagata viene dalla tabella ufficiale CPSM; le quote delle singole calli sono stimate (non esiste un rilievo altimetrico open data) e i tracciati delle passerelle sono indicativi.';
  body.sources = [...sources, SOURCES.vod];
  body.vodUrl = `${VOD_BASE_URL}/?${new URLSearchParams({ open: 'tide', marea: String(Math.round(level)) }).toString()}`;
  return { ok: true, body };
}

/** Ricerca di un luogo: come lo riconoscono gli altri strumenti, con le fermate ACTV e Alilaguna simili. */
export function findPlaceService(query: string): ServiceResult {
  const place = resolvePlace(query);
  const stops = findStops(query, 8);
  if (!place && stops.length === 0) return fail(404, 'place_not_found', `Nessun luogo trovato per «${query}».`);
  return {
    ok: true,
    body: {
      place: place ? placeOut(place) : null,
      stops: stops.map((s) => ({ name: s.name, operator: s.operator, lat: +s.lat.toFixed(6), lon: +s.lon.toFixed(6) })),
      sources: [SOURCES.osm, SOURCES.actv, SOURCES.alilaguna, SOURCES.vod],
    },
  };
}
