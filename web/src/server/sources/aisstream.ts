import 'server-only';
import type { ShipCategory, ShipItem } from '@/lib/types';

/**
 * Posizioni AIS delle navi da aisstream.io (WebSocket, chiave gratuita in AISSTREAM_API_KEY).
 * Il servizio vieta la connessione diretta dal browser: il server si collega per pochi secondi,
 * raccoglie i messaggi nell'area di Venezia e li unisce a quanto ricevuto nei minuti precedenti.
 */
const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';
export const AIS_SOURCE = 'aisstream.io (rete AIS di ricevitori a terra)';
/** Laguna, bocche di porto e rada antistante: [[lat, lon] SW, [lat, lon] NE] */
export const VENICE_BBOX: [[number, number], [number, number]] = [[45.15, 12.05], [45.62, 12.75]];
/** Una nave non sentita da più di questo tempo viene tolta (le navi ferme trasmettono ogni ~3 minuti). */
const SHIP_TTL_MS = 30 * 60_000;

const NAV_STATUS: Record<number, string> = {
  0: 'underway', 1: 'anchored', 2: 'notUnderCommand', 3: 'restricted', 4: 'constrained',
  5: 'moored', 6: 'aground', 7: 'fishing', 8: 'sailing',
};

/** Categoria dal codice di tipo AIS (ITU-R M.1371). */
export function shipCategory(type: number | null | undefined): ShipCategory {
  if (type === null || type === undefined) return 'OTHER';
  if (type >= 60 && type <= 69) return 'PASSENGER';
  if (type >= 70 && type <= 79) return 'CARGO';
  if (type >= 80 && type <= 89) return 'TANKER';
  if (type >= 40 && type <= 49) return 'HIGH_SPEED';
  if (type === 31 || type === 32 || type === 52) return 'TUG';
  if (type === 30) return 'FISHING';
  if (type === 36 || type === 37) return 'PLEASURE';
  if (type === 35 || type === 55 || type === 51 || type === 53 || type === 50 || type === 58) return 'SERVICE';
  return 'OTHER';
}

const clean = (s: unknown): string | null => {
  const v = typeof s === 'string' ? s.replace(/@+$/g, '').trim() : '';
  return v ? v : null;
};
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Stato accumulato: una voce per MMSI. */
export type AisState = Map<string, ShipItem>;

interface AisMessage {
  MessageType?: string;
  MetaData?: { MMSI?: number; ShipName?: string; latitude?: number; longitude?: number; time_utc?: string };
  Message?: Record<string, Record<string, unknown>>;
}

function aisTime(meta: AisMessage['MetaData'], fallback: Date): string {
  // formato aisstream: "2026-10-09 13:00:00.123456789 +0000 UTC"
  const m = meta?.time_utc?.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}Z` : fallback.toISOString();
}

/** Applica un messaggio AIS allo stato. Restituisce true se lo stato è cambiato. */
export function applyAisMessage(state: AisState, raw: unknown, now: Date = new Date()): boolean {
  const msg = raw as AisMessage;
  const mmsiNum = msg?.MetaData?.MMSI;
  if (!finite(mmsiNum)) return false;
  const mmsi = String(mmsiNum);
  const body = msg.Message?.[msg.MessageType ?? ''];
  if (!body) return false;
  const prev = state.get(mmsi);
  const base: ShipItem = prev ?? {
    mmsi, imo: null, name: clean(msg.MetaData?.ShipName) ?? `MMSI ${mmsi}`, callSign: null,
    category: 'OTHER', typeCode: null, lat: NaN, lon: NaN, speedKnots: null, courseDeg: null, heading: null,
    navStatus: null, destination: null, eta: null, lengthMeters: null, draughtMeters: null, lastSeen: aisTime(msg.MetaData, now),
  };

  if (msg.MessageType === 'PositionReport' || msg.MessageType === 'StandardClassBPositionReport' || msg.MessageType === 'ExtendedClassBPositionReport') {
    const lat = body.Latitude;
    const lon = body.Longitude;
    if (!finite(lat) || !finite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
    const sog = body.Sog;
    const cog = body.Cog;
    const hdg = body.TrueHeading;
    const nav = body.NavigationalStatus;
    state.set(mmsi, {
      ...base,
      name: base.name.startsWith('MMSI ') ? clean(msg.MetaData?.ShipName) ?? base.name : base.name,
      lat: Math.round(lat * 1e5) / 1e5,
      lon: Math.round(lon * 1e5) / 1e5,
      speedKnots: finite(sog) && sog < 102.2 ? Math.round(sog * 10) / 10 : null,
      courseDeg: finite(cog) && cog < 360 ? Math.round(cog) : null,
      heading: finite(hdg) && hdg < 360 ? hdg : null,
      navStatus: finite(nav) ? NAV_STATUS[nav] ?? null : base.navStatus,
      lastSeen: aisTime(msg.MetaData, now),
    });
    return true;
  }

  if (msg.MessageType === 'ShipStaticData') {
    const dim = body.Dimension as { A?: number; B?: number } | undefined;
    const len = dim && finite(dim.A) && finite(dim.B) ? dim.A + dim.B : null;
    const eta = body.Eta as { Month?: number; Day?: number; Hour?: number; Minute?: number } | undefined;
    const etaText = eta && eta.Month && eta.Day ? `${String(eta.Day).padStart(2, '0')}/${String(eta.Month).padStart(2, '0')} ${String(eta.Hour ?? 0).padStart(2, '0')}:${String(eta.Minute ?? 0).padStart(2, '0')} UTC` : null;
    const type = finite(body.Type) ? body.Type : null;
    state.set(mmsi, {
      ...base,
      name: clean(body.Name) ?? base.name,
      callSign: clean(body.CallSign),
      imo: finite(body.ImoNumber) && body.ImoNumber > 0 ? String(body.ImoNumber) : null,
      typeCode: type,
      category: shipCategory(type),
      destination: clean(body.Destination),
      eta: etaText,
      lengthMeters: len && len > 0 && len < 500 ? len : null,
      draughtMeters: finite(body.MaximumStaticDraught) && body.MaximumStaticDraught > 0 ? body.MaximumStaticDraught : null,
    });
    return true;
  }
  return false;
}

/** Navi con posizione nota e sentite di recente, ordinate per ultimo segnale. */
export function currentShips(state: AisState, now: Date = new Date()): ShipItem[] {
  const out: ShipItem[] = [];
  for (const [mmsi, s] of state) {
    if (now.getTime() - Date.parse(s.lastSeen) > SHIP_TTL_MS) {
      state.delete(mmsi);
      continue;
    }
    if (finite(s.lat) && finite(s.lon)) out.push(s);
  }
  return out.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

type WebSocketLike = {
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  send(data: string): void;
  close(): void;
};
type WebSocketCtor = new (url: string) => WebSocketLike;

/**
 * Si collega, ascolta per `durationMs` e chiude. Restituisce il numero di messaggi applicati.
 * Non lancia: in caso di errore restituisce quanto raccolto finora (anche zero).
 */
export async function collectAis(
  state: AisState,
  apiKey: string,
  durationMs: number,
  WS: WebSocketCtor | null = (globalThis as unknown as { WebSocket?: WebSocketCtor }).WebSocket ?? null,
): Promise<{ messages: number; error?: string }> {
  if (!WS) return { messages: 0, error: 'websocket_unavailable' };
  return new Promise((resolve) => {
    let messages = 0;
    let done = false;
    const ws = new WS(AISSTREAM_URL);
    const finish = (error?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* già chiusa */ }
      resolve(error ? { messages, error } : { messages });
    };
    const timer = setTimeout(() => finish(), durationMs);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [VENICE_BBOX],
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport', 'ShipStaticData'],
      }));
    };
    ws.onmessage = async (ev) => {
      try {
        const text = typeof ev.data === 'string' ? ev.data : ev.data instanceof Blob ? await ev.data.text() : new TextDecoder().decode(ev.data as ArrayBuffer);
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) return finish(`aisstream: ${parsed.error}`);
        if (applyAisMessage(state, parsed)) messages += 1;
      } catch {
        /* messaggio non valido: ignorato */
      }
    };
    ws.onerror = () => finish('websocket_error');
    ws.onclose = () => finish();
  });
}

// ---------------------------------------------------------------------------
// Istantanea condivisa (API navi, statistiche, MCP): al massimo un collegamento al minuto per istanza
// ---------------------------------------------------------------------------

const sharedState: AisState = new Map();
let lastCollect = 0;
let inFlight: Promise<void> | null = null;
let lastResult: { messages: number; error?: string } = { messages: 0 };
const MIN_INTERVAL_MS = 60_000;

export interface ShipsSnapshot {
  configured: boolean;
  ships: ShipItem[];
  collectedAt: string | null;
  messages: number;
  error?: string;
}

export async function getShipsSnapshot(listenMs = Number(process.env.AISSTREAM_LISTEN_MS) || 15_000): Promise<ShipsSnapshot> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) return { configured: false, ships: [], collectedAt: null, messages: 0, error: 'AISSTREAM_API_KEY non configurata' };
  if (Date.now() - lastCollect >= MIN_INTERVAL_MS) {
    inFlight ??= collectAis(sharedState, apiKey, listenMs).then((r) => {
      lastResult = r;
      lastCollect = Date.now();
      inFlight = null;
    });
    await inFlight;
  }
  return {
    configured: true,
    ships: currentShips(sharedState),
    collectedAt: lastCollect ? new Date(lastCollect).toISOString() : null,
    messages: lastResult.messages,
    error: lastResult.error,
  };
}

/** Stato attuale senza aprire collegamenti (per le statistiche): null se l'istanza non ha ancora ascoltato. */
export function peekShipsCount(): number | null {
  if (!process.env.AISSTREAM_API_KEY || !lastCollect) return null;
  return currentShips(sharedState).length;
}
