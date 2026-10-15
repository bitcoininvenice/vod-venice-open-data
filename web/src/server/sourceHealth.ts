import { romeLocalToDate } from '@/server/sources/tide';
import { FEEDS, type FeedId } from '@/lib/provenance/feeds';

type HealthStatus = 'ok' | 'stale' | 'down';

export interface SourceHealth {
  id: string;
  name: string;
  kind: 'live' | 'dataset';
  status: HealthStatus;
  /** Età del dato in minuti (null se non determinabile) */
  ageMinutes: number | null;
  /** Soglia oltre la quale il dato è considerato non aggiornato */
  maxAgeMinutes: number;
  detail?: string;
}

/** Classifica un flusso del registro (`lib/provenance/feeds.ts`) in base all'età del dato. */
export function assess(
  id: FeedId,
  kind: SourceHealth['kind'],
  observedAt: Date | null,
  maxAgeMinutes: number,
  now: Date = new Date(),
  detail?: string,
): SourceHealth {
  const name = FEEDS[id].label;
  if (!observedAt || Number.isNaN(observedAt.getTime())) {
    return { id, name, kind, status: 'down', ageMinutes: null, maxAgeMinutes, detail: detail ?? 'fonte non raggiungibile o senza data' };
  }
  const ageMinutes = Math.round((now.getTime() - observedAt.getTime()) / 60000);
  return { id, name, kind, status: ageMinutes <= maxAgeMinutes ? 'ok' : 'stale', ageMinutes, maxAgeMinutes, detail };
}

/** Le date dei feed del Comune sono in ora locale di Venezia senza offset. */
export const fromRomeLocal = (s: string | null | undefined): Date | null => (s ? romeLocalToDate(s) : null);
