'use client';

import { useEffect, useState } from 'react';
import type { ActvNotice } from './contracts/actvNotices';

let shared: { at: number; data: Promise<ActvNotice[]> } | null = null;

/** Avvisi ACTV (/api/avvisi-actv) letti al massimo ogni 5 minuti e condivisi tra le schede. */
function loadNotices(): Promise<ActvNotice[]> {
  if (!shared || Date.now() - shared.at > 5 * 60_000) {
    shared = {
      at: Date.now(),
      data: fetch('/api/avvisi-actv')
        .then((r) => r.json())
        .then((j) => (Array.isArray(j.data) ? (j.data as ActvNotice[]) : []))
        .catch(() => []),
    };
  }
  return shared.data;
}

export function useActvNotices(): ActvNotice[] {
  const [data, setData] = useState<ActvNotice[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadNotices().then((d) => !cancelled && setData(d));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

/** Avvisi su una fermata (per codice GTFS) e quelli sulle sue linee. */
export function noticesForStop(notices: ActvNotice[], gtfsIds: string[] = [], lines: string[] = []) {
  const ids = new Set(gtfsIds);
  const ls = new Set(lines.map((l) => l.toUpperCase()));
  const here = notices.filter((n) => n.stops.some((s) => ids.has(s.id)));
  const onLines = notices.filter((n) => !here.includes(n) && n.lines.some((l) => ls.has(l)));
  return { here, onLines };
}
