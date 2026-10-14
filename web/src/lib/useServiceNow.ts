'use client';

import { useEffect, useState } from 'react';
import { startPolling } from './polling';
import type { LineNow } from './serviceNow';

let shared: { at: number; data: Promise<LineNow[] | null> } | null = null;

/** /api/servizio letto al massimo ogni 25 s e condiviso tra le schede aperte. */
function loadServiceNow(): Promise<LineNow[] | null> {
  if (!shared || Date.now() - shared.at > 25_000) {
    shared = {
      at: Date.now(),
      data: fetch('/api/servizio')
        .then((r) => r.json())
        .then((j) => (j.success && Array.isArray(j.data) ? (j.data as LineNow[]) : null))
        .catch(() => null),
    };
  }
  return shared.data;
}

/** Servizio ACTV adesso, aggiornato ogni 30 s finché serve; null finché non arriva o se non disponibile. */
export function useServiceNow(enabled: boolean): LineNow[] | null {
  const [data, setData] = useState<LineNow[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const stop = startPolling(() => loadServiceNow().then((d) => !cancelled && setData(d)), 30_000);
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled]);
  return data;
}
