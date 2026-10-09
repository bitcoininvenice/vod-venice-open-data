/**
 * Limite di richieste per client in una finestra mobile (in memoria, per istanza del server).
 * Protegge le fonti esterne da un uso eccessivo tramite AI; non è un controllo di sicurezza distribuito.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const MAX_CLIENTS = 5_000;

const hits = new Map<string, number[]>();

export function allowRequest(key: string, now = Date.now(), max = MAX_PER_WINDOW): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > MAX_CLIENTS) {
    // pulizia dei client inattivi
    for (const [k, ts] of hits) if (ts.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}

/** Solo per i test */
export function resetRateLimit(): void {
  hits.clear();
}
