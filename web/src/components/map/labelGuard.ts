/**
 * Diradamento delle etichette sulla mappa.
 *
 * I layer disegnano le etichette direttamente con fillText (spesso su una "pillola" con roundRect).
 * Durante il disegno dei layer la guardia intercetta queste chiamate sul contesto: un'etichetta che
 * si sovrappone a una già disegnata, o oltre il numero massimo per frame, viene saltata insieme alla
 * sua pillola. Vince chi viene disegnato prima. I glifi brevi dentro i simboli (es. "+", "EV", "P")
 * non sono etichette e vengono sempre disegnati.
 */

export interface LabelGuardOptions {
  /** etichette al massimo per frame */
  maxLabels: number;
  /** spazio minimo tra due etichette, in pixel del canvas */
  padding: number;
}

const DEFAULT_LABEL_GUARD: LabelGuardOptions = { maxLabels: 70, padding: 3 };

/** Testi fino a questa lunghezza sono glifi dei simboli, non etichette. */
const GLYPH_MAX_LENGTH = 3;
/** Rettangoli arrotondati fino a queste dimensioni (unità del contesto) sono pillole di etichette. */
const PILL_MAX_HEIGHT = 24;
const PILL_MAX_WIDTH = 420;

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function boxesOverlap(a: Box, b: Box, pad = 0): boolean {
  return a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
}

/** Riquadro allineato agli assi di un rettangolo dopo la trasformazione corrente del contesto. */
function transformedBox(m: DOMMatrix, x: number, y: number, w: number, h: number): Box {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    xs.push(m.a * px + m.c * py + m.e);
    ys.push(m.b * px + m.d * py + m.f);
  }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function contains(outer: Box, inner: Box, tol = 2): boolean {
  return inner.x0 >= outer.x0 - tol && inner.x1 <= outer.x1 + tol && inner.y0 >= outer.y0 - tol && inner.y1 <= outer.y1 + tol;
}

/** Registro delle etichette disegnate in un frame (logica pura, testabile senza canvas). */
export class LabelRegistry {
  private boxes: Box[] = [];
  constructor(private opts: LabelGuardOptions) {}

  get count(): number {
    return this.boxes.length;
  }

  /** Vero se l'etichetta trova posto (e viene registrata). `ignore`: la propria pillola. */
  place(box: Box, ignore: Box | null = null): boolean {
    if (this.boxes.length >= this.opts.maxLabels) return false;
    if (this.boxes.some((b) => b !== ignore && boxesOverlap(b, box, this.opts.padding))) return false;
    this.boxes.push(box);
    return true;
  }
}

type TextFn = CanvasRenderingContext2D['fillText'];

/**
 * Esegue `draw` con la guardia attiva sul contesto e la rimuove alla fine.
 * `draw` riceve `unguarded`, per disegnare senza guardia elementi che non devono sparire (es. avvisi).
 */
export function withLabelGuard(
  ctx: CanvasRenderingContext2D,
  draw: (unguarded: (fn: () => void) => void) => void,
  opts: LabelGuardOptions = DEFAULT_LABEL_GUARD
): void {
  const registry = new LabelRegistry(opts);
  const orig = {
    beginPath: ctx.beginPath,
    roundRect: ctx.roundRect,
    fillText: ctx.fillText,
    strokeText: ctx.strokeText,
  };
  let active = true;
  /** pillola rifiutata: si saltano riempimento e testo fino al prossimo beginPath */
  let skipping = false;
  /** pillola accettata nel percorso corrente: il testo che ci sta dentro è già "registrato" */
  let openPill: Box | null = null;
  /** ultima decisione per lo stesso testo (contorno + riempimento dello stesso testo) */
  let last: { text: string; x: number; y: number; ok: boolean } | null = null;

  ctx.beginPath = function (this: CanvasRenderingContext2D) {
    if (active) {
      skipping = false;
      openPill = null;
    }
    return orig.beginPath.call(this);
  };

  ctx.roundRect = function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r?: number | DOMPointInit | (number | DOMPointInit)[]) {
    if (active && Math.abs(h) <= PILL_MAX_HEIGHT && Math.abs(w) <= PILL_MAX_WIDTH) {
      const box = transformedBox(this.getTransform(), Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h));
      if (!registry.place(box)) {
        skipping = true;
        return;
      }
      openPill = box;
    }
    return orig.roundRect.call(this, x, y, w, h, r);
  } as CanvasRenderingContext2D['roundRect'];

  const guardText = (fn: TextFn): TextFn =>
    function (this: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number) {
      if (!active || text.length <= GLYPH_MAX_LENGTH) return fn.call(this, text, x, y, maxWidth);
      if (skipping) return;
      if (last && last.text === text && last.x === x && last.y === y) {
        if (last.ok) fn.call(this, text, x, y, maxWidth);
        return;
      }
      const m = this.measureText(text);
      const box = transformedBox(
        this.getTransform(),
        x - m.actualBoundingBoxLeft,
        y - m.actualBoundingBoxAscent,
        m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
      );
      const ok = (openPill !== null && contains(openPill, box)) || registry.place(box, openPill);
      last = { text, x, y, ok };
      if (ok) fn.call(this, text, x, y, maxWidth);
    } as TextFn;

  ctx.fillText = guardText(orig.fillText);
  ctx.strokeText = guardText(orig.strokeText);

  const unguarded = (fn: () => void) => {
    active = false;
    try {
      fn();
    } finally {
      active = true;
    }
  };

  try {
    draw(unguarded);
  } finally {
    ctx.beginPath = orig.beginPath;
    ctx.roundRect = orig.roundRect;
    ctx.fillText = orig.fillText;
    ctx.strokeText = orig.strokeText;
  }
}
