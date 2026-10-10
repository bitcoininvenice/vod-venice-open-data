import { describe, expect, it, vi } from 'vitest';
import { firstHit, hitTester } from './hitTest';

// Schermo identico alle coordinate: lon -> x, lat -> y
const target = hitTester((lon, lat) => [lon, lat]);

describe('hitTest', () => {
  it('vince il primo elemento entro il raggio, nell’ordine dell’elenco', () => {
    const select = vi.fn();
    const hit = target({ items: [{ id: 'a', lon: 10, lat: 10 }, { id: 'b', lon: 11, lat: 10 }], radius: 5, select });
    hit(11, 10)?.();
    expect(select).toHaveBeenCalledWith({ id: 'a', lon: 10, lat: 10 });
  });

  it('fuori dal raggio non colpisce nulla', () => {
    const hit = target({ items: [{ lon: 0, lat: 0 }], radius: 5, select: () => {} });
    expect(hit(10, 0)).toBeNull();
  });

  it('raggio per elemento, spostamento verticale e punto assente', () => {
    const select = vi.fn();
    const items = [{ lon: 0, lat: 0, big: false }, { lon: 50, lat: 50, big: true }];
    const hit = target({ items, radius: (i) => (i.big ? 20 : 2), dy: -10, select });
    expect(hit(0, 0)).toBeNull(); // il punto è disegnato 10 px più in alto
    hit(0, -10)?.();
    expect(select).toHaveBeenLastCalledWith(items[0]);
    hit(60, 40)?.();
    expect(select).toHaveBeenLastCalledWith(items[1]);
    const none = target({ items, at: () => null, radius: 100, select });
    expect(none(0, 0)).toBeNull();
  });

  it('tracciati: basta un vertice entro il raggio', () => {
    const select = vi.fn();
    const route = { path: [[0, 0], [100, 0], [100, 100]] };
    const hit = target({ items: [route], at: () => null, path: (r) => r.path, radius: 5, select });
    hit(98, 97)?.();
    expect(select).toHaveBeenCalledWith(route);
  });

  it('firstHit rispetta la priorità e salta i livelli spenti', () => {
    const order: string[] = [];
    const a = target({ items: [{ lon: 0, lat: 0 }], radius: 5, select: () => order.push('a') });
    const b = target({ items: [{ lon: 0, lat: 0 }], radius: 5, select: () => order.push('b') });
    firstHit([false, null, a, b], 0, 0)?.();
    expect(order).toEqual(['a']);
    expect(firstHit([false, b], 50, 50)).toBeNull();
  });
});
