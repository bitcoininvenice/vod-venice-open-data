import 'server-only';

export type UpstreamResult<T> =
  | { ok: true; data: T; fetchedAt: string }
  | { ok: false; error: string };

interface FetchUpstreamOptions {
  /** Secondi di cache condivisa lato server (Next data cache). */
  revalidate?: number;
  timeoutMs?: number;
  responseType?: 'json' | 'arrayBuffer';
  headers?: Record<string, string>;
}

const USER_AGENT = 'VOD-VeniceOpenData/1.0 (+https://venice-open-data.vercel.app)';

/**
 * Legge una fonte esterna con timeout, cache condivisa e parsing validato.
 * Non lancia mai: in caso di errore restituisce { ok: false } e registra il motivo lato server,
 * così le route possono rispondere "non disponibile" invece di inventare un valore.
 */
export async function fetchUpstream<T>(
  url: string,
  parse: (raw: unknown) => T,
  { revalidate = 60, timeoutMs = 5000, responseType = 'json', headers = {} }: FetchUpstreamOptions = {},
): Promise<UpstreamResult<T>> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, ...headers },
    });
    if (!res.ok) {
      console.warn(`[upstream] ${url} -> HTTP ${res.status}`);
      return { ok: false, error: `upstream_http_${res.status}` };
    }
    const raw = responseType === 'arrayBuffer' ? await res.arrayBuffer() : await res.json();
    try {
      return { ok: true, data: parse(raw), fetchedAt: new Date().toISOString() };
    } catch (parseErr) {
      // Formato inatteso: registra un estratto per diagnosticare cambi di schema della fonte.
      const sample = responseType === 'json' ? JSON.stringify(raw).slice(0, 300) : '[binary]';
      console.warn(`[upstream] ${url} -> formato non valido: ${parseErr instanceof Error ? parseErr.message.slice(0, 200) : parseErr} | ${sample}`);
      return { ok: false, error: 'upstream_invalid_payload' };
    }
  } catch (err) {
    console.warn(`[upstream] ${url} -> ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: 'upstream_unavailable' };
  }
}
