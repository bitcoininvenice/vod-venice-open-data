import { describe, expect, it } from 'vitest';
import { boxesOverlap, LabelRegistry } from './labelGuard';

const box = (x0: number, y0: number, w: number, h: number) => ({ x0, y0, x1: x0 + w, y1: y0 + h });

describe('diradamento etichette', () => {
  it('riconosce le sovrapposizioni, con margine', () => {
    expect(boxesOverlap(box(0, 0, 10, 10), box(5, 5, 10, 10))).toBe(true);
    expect(boxesOverlap(box(0, 0, 10, 10), box(12, 0, 10, 10))).toBe(false);
    expect(boxesOverlap(box(0, 0, 10, 10), box(12, 0, 10, 10), 3)).toBe(true);
  });

  it('vince la prima etichetta e si rispetta il massimo per frame', () => {
    const r = new LabelRegistry({ maxLabels: 2, padding: 0 });
    expect(r.place(box(0, 0, 20, 10))).toBe(true);
    expect(r.place(box(10, 5, 20, 10))).toBe(false);
    expect(r.place(box(40, 0, 20, 10))).toBe(true);
    expect(r.place(box(100, 0, 20, 10))).toBe(false); // oltre il massimo
    expect(r.count).toBe(2);
  });

  it('il testo può uscire dalla propria pillola senza essere scartato', () => {
    const r = new LabelRegistry({ maxLabels: 10, padding: 2 });
    const pill = box(0, 0, 40, 14);
    expect(r.place(pill)).toBe(true);
    expect(r.place(box(2, 12, 30, 10), pill)).toBe(true);
    expect(r.place(box(2, 12, 30, 10))).toBe(false);
  });
});
