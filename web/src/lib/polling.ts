/**
 * Aggiornamento periodico che si ferma quando la scheda del browser è nascosta.
 *
 * Una scheda dimenticata aperta non deve continuare a interrogare le API (e a far rigenerare
 * la cache del server): finché è nascosta i giri vengono saltati; tornando visibile si ricarica
 * subito se l'ultimo caricamento è più vecchio dell'intervallo. Restituisce la funzione di arresto.
 */
export interface VisibilitySource {
  readonly hidden: boolean;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export function startPolling(
  load: () => void,
  intervalMs: number,
  doc: VisibilitySource | null = typeof document === 'undefined' ? null : document,
  now: () => number = Date.now,
): () => void {
  let last = now();
  const run = () => {
    last = now();
    load();
  };
  run();
  const id = setInterval(() => {
    if (!doc?.hidden) run();
  }, intervalMs);
  const onVisible = () => {
    if (doc && !doc.hidden && now() - last >= intervalMs) run();
  };
  doc?.addEventListener('visibilitychange', onVisible);
  return () => {
    clearInterval(id);
    doc?.removeEventListener('visibilitychange', onVisible);
  };
}
