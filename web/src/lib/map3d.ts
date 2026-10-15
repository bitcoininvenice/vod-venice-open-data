/**
 * Vista 3D della mappa: il canvas è inclinato via CSS con
 * `perspective(PERSPECTIVE_PX) rotateX(TILT_DEG) scale(SCALE)` e transform-origin al centro.
 * Le coordinate di clic/tocco sono nello spazio dello schermo: vanno riportate sul piano
 * della mappa prima dell'hit test, altrimenti in 3D si seleziona il punto sbagliato.
 */
const MAP_3D = { PERSPECTIVE_PX: 1400, TILT_DEG: 24, SCALE: 1.06 } as const;

export const MAP_3D_CSS_TRANSFORM = `perspective(${MAP_3D.PERSPECTIVE_PX}px) rotateX(${MAP_3D.TILT_DEG}deg) scale(${MAP_3D.SCALE})`;

const TH = (MAP_3D.TILT_DEG * Math.PI) / 180;

/** Piano della mappa -> schermo (per i test e per verificare l'inversa). */
export function projectTo3D(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const { PERSPECTIVE_PX: d, SCALE: s } = MAP_3D;
  const px = (x - width / 2) * s;
  const py = (y - height / 2) * s;
  const z = py * Math.sin(TH);
  const k = d / (d - z);
  return { x: px * k + width / 2, y: py * Math.cos(TH) * k + height / 2 };
}

/** Schermo -> piano della mappa (inversa esatta di projectTo3D). */
export function unprojectFrom3D(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const { PERSPECTIVE_PX: d, SCALE: s } = MAP_3D;
  const X = x - width / 2;
  const Y = y - height / 2;
  const py = (Y * d) / (d * Math.cos(TH) + Y * Math.sin(TH));
  const k = d / (d - py * Math.sin(TH));
  return { x: X / k / s + width / 2, y: py / s + height / 2 };
}
