import { LAND_HI_URL } from '@/lib/simulation-data';
import type { ColorScheme } from '@/lib/solar';
import { isStreetsLoaded, paintStreets, requestStreets } from './streetsLayer';

export { isStreetsLoaded, requestStreets };

/** Poligoni (anelli di coordinate x,y alternate) nella griglia virtuale della mappa. */
export type LandPolygons = number[][][];

let landHi: LandPolygons | null = null;
let landHiRequestedAt = 0;

export const isLandHiLoaded = (): boolean => landHi !== null;

/** Scarica le isole dettagliate una sola volta (nuovo tentativo dopo 30 s se la richiesta fallisce). */
export function requestLandHi(onReady: () => void): void {
  if (landHi || Date.now() - landHiRequestedAt < 30_000) return;
  landHiRequestedAt = Date.now();
  fetch(LAND_HI_URL)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<LandPolygons>;
    })
    .then((polys) => {
      landHi = polys;
      onReady();
    })
    .catch((e) => console.warn('Isole dettagliate non disponibili:', e));
}

/** Riquadro [minX, minY, maxX, maxY] di ogni poligono, calcolato una volta per insieme. */
const bboxCache = new WeakMap<LandPolygons, Float32Array>();

export function polygonBoxes(polys: LandPolygons): Float32Array {
  let boxes = bboxCache.get(polys);
  if (boxes) return boxes;
  boxes = new Float32Array(polys.length * 4);
  polys.forEach((rings, p) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i += 2) {
        if (ring[i] < x0) x0 = ring[i];
        if (ring[i] > x1) x1 = ring[i];
        if (ring[i + 1] < y0) y0 = ring[i + 1];
        if (ring[i + 1] > y1) y1 = ring[i + 1];
      }
    }
    boxes!.set([x0, y0, x1, y1], p * 4);
  });
  bboxCache.set(polys, boxes);
  return boxes;
}

/** Indici dei poligoni che intersecano la vista (in unità della griglia, con margine). */
export function visiblePolygons(boxes: Float32Array, view: { x0: number; y0: number; x1: number; y1: number }): number[] {
  const out: number[] = [];
  for (let p = 0; p < boxes.length / 4; p++) {
    const i = p * 4;
    if (boxes[i + 2] < view.x0 || boxes[i] > view.x1 || boxes[i + 3] < view.y0 || boxes[i + 1] > view.y1) continue;
    out.push(p);
  }
  return out;
}

interface BaseMapOptions {
  cw: number;
  ch: number;
  dpr: number;
  camera: { x0: number; y0: number; s: number };
  pal: ColorScheme;
  is3DView: boolean;
  /** usa le isole dettagliate (solo se già caricate) */
  zoomed: boolean;
  landLo: LandPolygons;
  zoomFactor?: number;
}

let cache: { canvas: HTMLCanvasElement; key: string } | null = null;

function paint(b: CanvasRenderingContext2D, o: BaseMapOptions, polys: LandPolygons): void {
  const { cw, ch, camera, pal } = o;
  const sx = (x: number) => (x - camera.x0) * camera.s;
  const sy = (y: number) => (y - camera.y0) * camera.s;
  b.fillStyle = pal.water;
  b.fillRect(0, 0, cw, ch);

  // Solo i poligoni in vista (margine di 8 px per contorni e ombra 3D)
  const m = 8 / camera.s;
  const visible = visiblePolygons(polygonBoxes(polys), {
    x0: camera.x0 - m,
    y0: camera.y0 - m,
    x1: camera.x0 + cw / camera.s + m,
    y1: camera.y0 + ch / camera.s + m,
  });

  const trace = (rings: number[][], dy: number) => {
    b.beginPath();
    for (const ring of rings) {
      if (ring.length < 4) continue;
      b.moveTo(sx(ring[0]), sy(ring[1]) + dy);
      for (let i = 2; i < ring.length; i += 2) b.lineTo(sx(ring[i]), sy(ring[i + 1]) + dy);
      b.closePath();
    }
  };

  if (o.is3DView) {
    b.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (const p of visible) {
      trace(polys[p], 4);
      b.fill();
    }
  }
  b.fillStyle = pal.land;
  b.strokeStyle = pal.coast;
  b.lineWidth = 1;
  for (const p of visible) {
    trace(polys[p], 0);
    b.fill();
    b.stroke();
  }

  // 3. Rete pedonale: calli, rami, salizzade, fondamenta e ponti di Venezia
  if (isStreetsLoaded() && o.zoomFactor && o.zoomFactor >= 1.7) {
    paintStreets(b, {
      cw: o.cw,
      ch: o.ch,
      camera: o.camera,
      pal: o.pal,
      zoomFactor: o.zoomFactor,
    });
  }
}

/** Disegna acqua e isole sul contesto (già scalato per il devicePixelRatio). */
export function drawBaseMap(ctx: CanvasRenderingContext2D, o: BaseMapOptions): void {
  const polys = o.zoomed && landHi ? landHi : o.landLo;
  const w = Math.round(o.cw * o.dpr);
  const h = Math.round(o.ch * o.dpr);
  const streetsActive = isStreetsLoaded() && Boolean(o.zoomFactor && o.zoomFactor >= 1.7);
  const key = [
    w,
    h,
    o.dpr,
    o.camera.x0,
    o.camera.y0,
    o.camera.s,
    o.pal.water,
    o.pal.land,
    o.pal.coast,
    o.is3DView,
    polys === landHi,
    streetsActive,
  ].join('|');
  if (!cache || cache.key !== key) {
    const canvas = cache?.canvas ?? document.createElement('canvas');
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const b = canvas.getContext('2d');
    if (!b) return;
    b.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    paint(b, o, polys);
    cache = { canvas, key };
  }
  ctx.drawImage(cache.canvas, 0, 0, o.cw, o.ch);
}
