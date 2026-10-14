import 'server-only';
import { GET as tideGET } from '@/app/api/tide/route';
import { GET as weatherGET } from '@/app/api/weather/route';
import { GET as windGET } from '@/app/api/wind-field/route';
import { GET as environmentGET } from '@/app/api/environment/route';
import { GET as regionalGET } from '@/app/api/regional-data/route';
import { GET as marineGET } from '@/app/api/marine-sensors/route';
import { GET as stopsGET } from '@/app/api/stops/route';
import { GET as vehiclesGET } from '@/app/api/realtime/vehicles/route';
import { GET as alilagunaGET } from '@/app/api/alilaguna/route';
import { GET as emergencyGET } from '@/app/api/emergency-health/route';
import { GET as cityAssetsGET } from '@/app/api/city-assets/route';
import { GET as veniceAssetsGET } from '@/app/api/venice-assets/route';
import { GET as heritageGET } from '@/app/api/heritage/route';
import { GET as lagoonNetworkGET } from '@/app/api/lagoon-network/route';
import { GET as fiberGET } from '@/app/api/fiber/route';
import { GET as cantieriGET } from '@/app/api/cantieri/route';
import { GET as bdapGET } from '@/app/api/opere-bdap/route';
import { GET as loraGET } from '@/app/api/lora-gateways/route';
import { GET as serviceGET } from '@/app/api/servizio/route';
import { GET as actvNoticesGET } from '@/app/api/avvisi-actv/route';
import { GET as scheduleSpeedGET } from '@/app/api/velocita-orario/route';
import { serverSimulation } from '@/server/sources/simulationServer';
import { lastDeparturesByStop } from '@/lib/lastDepartures';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { clock } from '@/lib/tripView';
import { romeDayType, romeTomorrowDayType } from '@/lib/time';
import { GET as ordinancesGET } from '@/app/api/ordinanze/route';
import { GET as sportsGET } from '@/app/api/sports/route';
import { GET as nauticalGET } from '@/app/api/nautical/route';
import { GET as parksGET } from '@/app/api/parks/route';
import { GET as censusGET } from '@/app/api/census/route';
import civiciData from '@/data/osm-civici.json';
import busStopsData from '@/data/actv-bus-stops.json';
import flixbusData from '@/data/flixbus-venezia.json';
import type { FlixTrip } from '@/lib/flixbus';
import { romeToday } from '@/lib/time';
import { GET as healthGET } from '@/app/api/health/route';
import tourism from '@/data/turismo-comuni.json';
import cruscotto from '@/data/cruscotto-comuni.json';
import { canalLengthMeters } from '@/lib/lagoonNetwork';
import { fiberCellBounds, fiberOperators } from '@/lib/fiber';

/**
 * Per ogni dataset del catalogo MCP: richiama l'endpoint del sito (stessa cache, stessa logica)
 * ed estrae l'elenco delle voci. Nessuna fonte viene interrogata in modo diverso dal sito.
 */
export interface LoadedDataset {
  items: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}

type Json = Record<string, unknown> & { data?: unknown; meta?: unknown };
type Row = Record<string, unknown>;

async function read(res: Response | Promise<Response>): Promise<Json> {
  return (await (await res).json()) as Json;
}

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const field = (o: unknown, k: string): unknown => (o && typeof o === 'object' ? (o as Row)[k] : undefined);

const MARKER_NAMES: Record<number, string> = { 1: 'briccola', 2: 'palo', 3: 'segnale', 4: 'boa', 5: 'fanale' };
const FIBER_TECH: Record<number, string> = { 3: 'FTTH', 2: 'FTTC', 1: 'ADSL' };

export const MCP_LOADERS: Record<string, () => Promise<LoadedDataset>> = {
  tide: async () => {
    const j = await read(tideGET());
    const d = (j.data ?? {}) as Row;
    return {
      items: asRows(d.stations),
      meta: { reference: d.reference, category: d.category, trend: d.trend, forecast: d.forecast, moseGates: asRows(d.moseGates).length, sources: j.meta },
    };
  },
  weather_stations: async () => {
    const j = await read(weatherGET());
    // La temperatura del centro storico va nel contesto: è la risposta a "che temperatura c'è a Venezia?"
    return { items: asRows(field(j.data, 'windStations')), meta: { ...(j.meta as Row), cityTemp: field(j.data, 'cityTemp') ?? null } };
  },
  wind_forecast: async () => {
    const j = await read(windGET());
    const f = j.data as { lon0: number; lat0: number; dLon: number; dLat: number; nx: number; ny: number; u: number[]; v: number[]; validTime: string } | null;
    if (!f) return { items: [], meta: { note: 'Previsione non disponibile in questo momento' } };
    const items: Row[] = [];
    for (let j2 = 0; j2 < f.ny; j2++) {
      for (let i = 0; i < f.nx; i++) {
        const k = j2 * f.nx + i;
        const speed = Math.hypot(f.u[k], f.v[k]);
        // direzione meteorologica: da dove soffia
        const fromDeg = Math.round(((Math.atan2(-f.u[k], -f.v[k]) * 180) / Math.PI + 360) % 360);
        items.push({ lat: +(f.lat0 + j2 * f.dLat).toFixed(3), lon: +(f.lon0 + i * f.dLon).toFixed(3), speedKmh: Math.round(speed * 3.6), fromDirectionDeg: fromDeg });
      }
    }
    return { items, meta: { validTime: f.validTime } };
  },
  air_quality: async () => {
    const j = await read(environmentGET());
    return { items: asRows(field(j.data, 'airStations')), meta: { euLimits: field(j.data, 'euLimits'), ...(j.meta as Row) } };
  },
  pollen: async () => {
    const j = await read(regionalGET());
    return { items: asRows(field(j.data, 'pollenStations')), meta: { forecast: j.pollenSource, measured: j.pollenMeasuredSource } };
  },
  lagoon_probes: async () => {
    const j = await read(regionalGET());
    return { items: asRows(field(j.data, 'waterQuality')), meta: j.waterQualitySource as Row };
  },
  marine_platform: async () => {
    const j = await read(marineGET());
    return { items: asRows(field(j.data, 'oceanStations')), meta: j.meta as Row };
  },
  public_transport_stops: async () => {
    const j = await read(stopsGET(new Request('http://vod.local/api/stops')));
    return { items: asRows(j.data) };
  },
  flixbus: async () => {
    const today = romeToday().replace(/-/g, '');
    const hhmm = (ymd: string, s: number) =>
      new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8))) + s * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    const items: Row[] = [];
    for (const t of flixbusData.trips as unknown as FlixTrip[]) {
      // la data UTC di servizio può essere il giorno prima per le corse notturne: basta che una data sia oggi o ieri
      const ymd = t.dates.find((d) => d === today);
      if (!ymd) continue;
      items.push({ line: t.line, route: t.name, from: t.from, to: t.to, veniceStops: t.stops.filter((s) => s[4]).map((s) => ({ stop: s[3], arrival: hhmm(ymd, s[1]), departure: hhmm(ymd, s[2]) })) });
    }
    return { items, meta: { source: flixbusData.source, license: flixbusData.license, attribution: flixbusData.attribution, generatedAt: flixbusData.generatedAt } };
  },
  bus_stops: async () => ({ items: asRows(busStopsData.stops), meta: { source: busStopsData.source, license: busStopsData.license, generatedAt: busStopsData.generatedAt } }),
  realtime_vehicles: async () => {
    const j = await read(vehiclesGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  alilaguna_boats: async () => {
    const j = await read(alilagunaGET());
    return { items: asRows(j.boats), meta: { ...(j.metadata as Row), stops: asRows(j.stops).length } };
  },
  // Navi (aisstream.io) e voli (OpenSky) non sono esposti via MCP: i termini delle fonti non prevedono
  // la ridistribuzione a terzi. Restano visibili solo nella mappa di VOD.
  pharmacies: async () => {
    const j = await read(emergencyGET());
    return { items: asRows(field(j.data, 'pharmacies')), meta: { dutyRota: 'https://www.aulss3.veneto.it/Farmacie-di-turno' } };
  },
  defibrillators: async () => {
    const j = await read(emergencyGET());
    return { items: asRows(field(j.data, 'dae')), meta: j.meta as Row };
  },
  drinking_fountains: async () => ({ items: asRows((await read(cityAssetsGET())).fountains) }),
  recycling_centres: async () => ({ items: asRows((await read(cityAssetsGET())).recyclingCentres) }),
  libraries: async () => ({ items: asRows((await read(cityAssetsGET())).libraries) }),
  wifi_venues: async () => ({ items: asRows((await read(cityAssetsGET())).wifiVenues) }),
  parkings: async () => ({ items: asRows((await read(cityAssetsGET())).parkings) }),
  ev_charging: async () => ({ items: asRows(field((await read(veniceAssetsGET())).data, 'evCharging')) }),
  wifi_hotspots: async () => ({ items: asRows(field((await read(veniceAssetsGET())).data, 'wifiHotspots')) }),
  monumental_trees: async () => ({ items: asRows(field((await read(veniceAssetsGET())).data, 'urbanTrees')) }),
  wellheads: async () => ({ items: asRows(field((await read(heritageGET())).data, 'wells')) }),
  channel_markers: async () => {
    const j = await read(lagoonNetworkGET());
    const markers = asRows(field(j.data, 'markers')) as unknown as number[][];
    return {
      items: markers.map(([lon, lat, kind, id]) => ({ type: MARKER_NAMES[kind] ?? 'segnale', lat, lon, osmUrl: `https://www.openstreetmap.org/node/${id}` })),
      meta: { counts: field(j.data, 'counts'), note: field(j.meta, 'note') },
    };
  },
  canals: async () => {
    const j = await read(lagoonNetworkGET());
    const canals = asRows(field(j.data, 'canals')) as unknown as Array<{ id: number; name: string | null; coords: [number, number][] }>;
    return {
      items: canals.map((c) => {
        const mid = c.coords[Math.floor(c.coords.length / 2)];
        return { name: c.name, lengthMeters: Math.round(canalLengthMeters(c.coords)), lat: mid[1], lon: mid[0], osmUrl: `https://www.openstreetmap.org/way/${c.id}` };
      }),
    };
  },
  fiber_coverage: async () => {
    const j = await read(fiberGET());
    const ds = j.data as { origin: [number, number]; cellDeg: [number, number]; cells: [number, number, number, number][]; dataDate: string };
    return {
      items: ds.cells.map(([i, k, cls, ops]) => {
        const b = fiberCellBounds(ds, i, k);
        return { technology: FIBER_TECH[cls], ftthOperators: fiberOperators(ops), lat: +((b.lat0 + b.lat1) / 2).toFixed(5), lon: +((b.lon0 + b.lon1) / 2).toFixed(5) };
      }),
      meta: { dataDate: ds.dataDate, attribution: field(j.meta, 'attribution') },
    };
  },
  public_works: async () => {
    const j = await read(cantieriGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  nautical: async () => {
    const j = await read(nauticalGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  parks: async () => {
    const j = await read(parksGET());
    // I perimetri restano fuori: per le domande bastano nome, tipo, superficie e posizione del centro
    return { items: asRows(j.data).map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'rings'))), meta: j.meta as Row };
  },
  sports: async () => {
    const j = await read(sportsGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  actv_notices: async () => {
    const j = await read(actvNoticesGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  service_now: async () => {
    const j = await read(serviceGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  last_departures: async () => {
    const sim = await serverSimulation();
    if (!sim) return { items: [], meta: { error: 'orario non disponibile' } };
    const day = romeDayType();
    const items: Row[] = [];
    for (const [i, list] of lastDeparturesByStop(sim.model, ACTV_STOPS_REFERENCE, day, romeTomorrowDayType())) {
      const s = ACTV_STOPS_REFERENCE[i];
      for (const d of list) items.push({ stop: s.name, lat: s.lat, lon: s.lon, line: d.line, headsign: d.headsign, seconds: d.time, time: clock(d.time), afterMidnight: d.time >= 86400 });
    }
    return { items, meta: { dayType: day, source: 'Orario ufficiale ACTV (GTFS)' } };
  },
  schedule_speed: async () => {
    const j = await read(scheduleSpeedGET());
    // i tracciati restano fuori: per le domande bastano linea, tratto e tempi
    return { items: asRows(j.data).map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'path'))), meta: { ...(j.meta as Row), summary: j.summary } };
  },
  city_orders: async () => {
    const j = await read(ordinancesGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  lora_gateways: async () => {
    const j = await read(loraGET());
    return { items: asRows(j.data), meta: j.meta as Row };
  },
  public_works_bdap: async () => {
    const j = await read(bdapGET());
    return { items: asRows(j.data), meta: { ...(j.meta as Row), summary: j.summary } };
  },
  house_numbers: async () => {
    const civici = civiciData.civici as unknown as Record<string, [number, string, number, number][]>;
    const items: Row[] = Object.entries(civici).flatMap(([sestiere, rows]) =>
      rows.map(([n, l, lon, lat]) => ({ label: `${sestiere} ${n}${l ? ` ${l}` : ''}`, sestiere, number: n, letter: l || null, lat, lon })),
    );
    return { items, meta: { source: civiciData.source, license: civiciData.license, attribution: civiciData.attribution, generatedAt: civiciData.generatedAt, coverage: civiciData.counts, note: civiciData.note } };
  },
  census: async () => {
    const j = await read(censusGET());
    const d = j.data as { city: Row; historicCentre: Row; municipalities: Row[]; sestieri: Row[]; islands: Row[] };
    // Una riga per zona, con il livello (comune, municipalità, centro storico, sestiere, isola)
    const items: Row[] = [
      { level: 'comune', name: 'Comune di Venezia', ...d.city },
      ...d.municipalities.map((r) => ({ level: 'municipalità', ...r })),
      { level: 'centro storico', name: 'Centro storico (sei sestieri)', ...d.historicCentre },
      ...d.sestieri.map((r) => ({ level: 'sestiere', ...r })),
      ...d.islands.map((r) => ({ level: 'isola', ...r })),
    ];
    return { items, meta: j.meta as Row };
  },
  tourism: async () => ({ items: tourism.comuni as unknown as Row[], meta: { year: tourism.tourismYear, populationDate: tourism.populationDate, source: tourism.source } }),
  municipal_profile: async () => ({
    items: cruscotto.comuni as unknown as Row[],
    meta: { source: cruscotto.source, sourceUrl: cruscotto.sourceUrl, license: cruscotto.license, retrievedAt: cruscotto.generatedAt },
  }),
  sources_status: async () => {
    const j = await read(healthGET());
    return { items: asRows(j.sources), meta: { status: j.status, checkedAt: j.checkedAt } };
  },
};
