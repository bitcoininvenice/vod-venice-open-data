/**
 * Riconoscimento del punto cliccato sulla mappa.
 *
 * Ogni livello cliccabile è descritto da un `HitTarget` (elementi, raggio in px, posizione o tracciato,
 * azione); `firstHit` prova i bersagli nell'ordine dato e, dentro ciascuno, gli elementi nell'ordine
 * dell'elenco: vince il primo entro il raggio, come la priorità di disegno.
 */

/** Longitudine/latitudine -> coordinate dello schermo in px. */
export type ScreenOf = (lon: number, lat: number) => readonly [number, number];

/** Bersaglio pronto: restituisce l'azione da eseguire se il clic lo colpisce. */
export type Hit = (x: number, y: number) => (() => void) | null;

export interface HitTarget<T> {
  items: readonly T[];
  /** raggio di cattura in px, fisso o per elemento */
  radius: number | ((item: T) => number);
  /** posizione del punto [lon, lat]; predefinita: campi lon/lat. null: elemento non cliccabile */
  at?: (item: T) => readonly [number, number] | null;
  /** tracciato [lon, lat][]: si colpisce uno qualsiasi dei vertici (provato dopo il punto) */
  path?: (item: T) => readonly (readonly number[])[];
  /** il punto è disegnato più in alto (es. etichetta sopra il simbolo): spostamento in px */
  dy?: number;
  select: (item: T) => void;
}

const lonLat = (item: unknown) => {
  const p = item as { lon: number; lat: number };
  return [p.lon, p.lat] as const;
};

/** Costruttore di bersagli per la vista corrente. */
export function hitTester(screen: ScreenOf) {
  return function target<T>(spec: HitTarget<T>): Hit {
    const at = spec.at ?? lonLat;
    return (x, y) => {
      for (const item of spec.items) {
        const r = typeof spec.radius === 'number' ? spec.radius : spec.radius(item);
        const p = at(item);
        if (p) {
          const [px, py] = screen(p[0], p[1]);
          if (Math.hypot(x - px, y - (py + (spec.dy ?? 0))) <= r) return () => spec.select(item);
        }
        if (spec.path) {
          for (const v of spec.path(item)) {
            const [px, py] = screen(v[0], v[1]);
            if (Math.hypot(x - px, y - py) <= r) return () => spec.select(item);
          }
        }
      }
      return null;
    };
  };
}

/** Azione del primo bersaglio colpito; i bersagli `false`/`null` (livelli spenti) sono saltati. */
export function firstHit(targets: readonly (Hit | false | null | undefined)[], x: number, y: number): (() => void) | null {
  for (const hit of targets) {
    if (!hit) continue;
    const action = hit(x, y);
    if (action) return action;
  }
  return null;
}

