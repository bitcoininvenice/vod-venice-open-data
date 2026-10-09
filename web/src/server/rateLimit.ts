/**
 * Limitatore a finestra fissa in memoria, per singola istanza del server.
 *
 * Su piattaforme serverless (Vercel) ogni istanza ha la propria memoria: il limite è quindi
 * una protezione di base contro raffiche da un singolo client. Per un limite globale usare
 * una regola del firewall della piattaforma (Vercel WAF) o uno store condiviso (es. Redis).
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** secondi alla riapertura della finestra */
  retryAfter: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= maxKeys) {
        // pulizia delle finestre scadute; se ancora pieno si svuota (evita crescita illimitata)
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        if (hits.size >= maxKeys) hits.clear();
      }
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    const allowed = entry.count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - entry.count),
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  };
}

/** Chiave del client per i limiti: primo indirizzo di X-Forwarded-For, poi X-Real-IP. */
export function clientKey(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
