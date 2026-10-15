import 'server-only';
import type { FlightItem } from '@/lib/types';
import { OPENSKY_STATES_URL, OPENSKY_TOKEN_URL, parseOpenSkyStates } from './opensky';
import { USER_AGENT } from '@/server/upstream';

/**
 * Unico punto di accesso a OpenSky per voli, stato delle fonti e statistiche.
 *
 * Quota: con un account OpenSky concede circa 4.000 crediti al giorno e la nostra area costa 1 credito a
 * richiesta. Una richiesta ogni 30 s sono al massimo 2.880 al giorno, entro la quota anche con la mappa
 * sempre aperta. Le tre route condividono la stessa risposta (prima ne facevano tre separate, due senza
 * credenziali). Con 429 (quota finita) si aspetta il tempo indicato da OpenSky senza riprovare, mostrando
 * l'ultimo dato valido dichiarato come tale.
 */
export const OPENSKY_REFRESH_S = 30;
/** Attesa se OpenSky risponde 429 senza dire quanto aspettare */
const DEFAULT_BACKOFF_S = 15 * 60;
/** L'ultimo dato valido si mostra al massimo per (s) */
const STALE_MAX_S = 10 * 60;

export interface OpenSkyResult {
  ok: boolean;
  flights: FlightItem[];
  /** istante della lettura usata (ISO) */
  fetchedAt: string | null;
  /** dato vecchio mostrato mentre OpenSky non risponde o la quota è finita */
  stale: boolean;
  /** quota esaurita: si riprova da questo istante (ISO) */
  quotaUntil: string | null;
  error?: string;
}

let token: { value: string; expiresAt: number } | null = null;
let last: { flights: FlightItem[]; at: number } | null = null;
let inflight: Promise<OpenSkyResult> | null = null;
let blockedUntil = 0;

/** Token OAuth2 (client credentials) se configurato: alza la quota rispetto all'accesso anonimo. */
async function getToken(fetchImpl: typeof fetch): Promise<string | null> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (token && token.expiresAt > Date.now() + 30_000) return token.value;
  try {
    const res = await fetchImpl(OPENSKY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 1800) * 1000 };
    return token.value;
  } catch {
    return null;
  }
}

/** Secondi da aspettare dopo un 429: intestazione di OpenSky, poi Retry-After, poi il valore prudente. */
export function retryAfterSeconds(headers: Headers): number {
  for (const name of ['x-rate-limit-retry-after-seconds', 'retry-after']) {
    const v = Number(headers.get(name));
    if (Number.isFinite(v) && v > 0) return Math.min(v, 24 * 3600);
  }
  return DEFAULT_BACKOFF_S;
}

function fallback(now: number, error: string): OpenSkyResult {
  const usable = last && now - last.at <= STALE_MAX_S * 1000 ? last : null;
  return {
    ok: !!usable,
    flights: usable?.flights ?? [],
    fetchedAt: usable ? new Date(usable.at).toISOString() : null,
    stale: !!usable,
    quotaUntil: blockedUntil > now ? new Date(blockedUntil).toISOString() : null,
    error,
  };
}

async function load(fetchImpl: typeof fetch, now: number): Promise<OpenSkyResult> {
  if (blockedUntil > now) return fallback(now, 'quota');
  const bearer = await getToken(fetchImpl);
  try {
    const res = await fetchImpl(OPENSKY_STATES_URL, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': USER_AGENT, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      // cache dei dati di Next condivisa tra le istanze del server, oltre alla memoria del processo
      next: { revalidate: OPENSKY_REFRESH_S },
    });
    if (res.status === 429) {
      blockedUntil = now + retryAfterSeconds(res.headers) * 1000;
      console.warn(`[opensky] quota esaurita, nuovo tentativo dopo ${new Date(blockedUntil).toISOString()}`);
      return fallback(now, 'quota');
    }
    if (!res.ok) return fallback(now, `upstream_http_${res.status}`);
    const flights = parseOpenSkyStates(await res.json());
    last = { flights, at: now };
    return { ok: true, flights, fetchedAt: new Date(now).toISOString(), stale: false, quotaUntil: null };
  } catch {
    return fallback(now, 'upstream_unavailable');
  }
}

/**
 * Voli nell'area di Venezia: una sola lettura ogni OPENSKY_REFRESH_S per istanza del server, condivisa da
 * tutte le route e dalle richieste contemporanee.
 */
export function openSkyFlights(fetchImpl: typeof fetch = fetch, now: number = Date.now()): Promise<OpenSkyResult> {
  if (last && now - last.at < OPENSKY_REFRESH_S * 1000) {
    return Promise.resolve({ ok: true, flights: last.flights, fetchedAt: new Date(last.at).toISOString(), stale: false, quotaUntil: null });
  }
  inflight ??= load(fetchImpl, now).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Solo per i test: azzera cache, token e attesa */
export function resetOpenSkyClient(): void {
  token = null;
  last = null;
  inflight = null;
  blockedUntil = 0;
}
