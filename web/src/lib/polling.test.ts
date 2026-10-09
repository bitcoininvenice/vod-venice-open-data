import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startPolling, type VisibilitySource } from './polling';

function fakeDoc() {
  const listeners = new Set<() => void>();
  const doc = {
    hidden: false,
    addEventListener: (_: 'visibilitychange', l: () => void) => listeners.add(l),
    removeEventListener: (_: 'visibilitychange', l: () => void) => listeners.delete(l),
  };
  const setHidden = (h: boolean) => {
    doc.hidden = h;
    listeners.forEach((l) => l());
  };
  return { doc: doc as VisibilitySource & { hidden: boolean }, setHidden, listeners };
}

describe('startPolling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('carica subito e poi a ogni intervallo', () => {
    const load = vi.fn();
    const stop = startPolling(load, 1000, fakeDoc().doc);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(load).toHaveBeenCalledTimes(4);
    stop();
  });

  it('salta i giri con la scheda nascosta e ricarica al ritorno se il dato è vecchio', () => {
    const load = vi.fn();
    const { doc, setHidden } = fakeDoc();
    const stop = startPolling(load, 1000, doc, Date.now);
    setHidden(true);
    vi.advanceTimersByTime(10_000);
    expect(load).toHaveBeenCalledTimes(1);
    setHidden(false);
    expect(load).toHaveBeenCalledTimes(2);
    stop();
  });

  it('al ritorno non ricarica se il dato è ancora fresco', () => {
    const load = vi.fn();
    const { doc, setHidden } = fakeDoc();
    const stop = startPolling(load, 60_000, doc, Date.now);
    setHidden(true);
    vi.advanceTimersByTime(5_000);
    setHidden(false);
    expect(load).toHaveBeenCalledTimes(1);
    stop();
  });

  it('l’arresto ferma il timer e rimuove il listener', () => {
    const load = vi.fn();
    const { doc, listeners } = fakeDoc();
    const stop = startPolling(load, 1000, doc);
    stop();
    vi.advanceTimersByTime(5000);
    expect(load).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });
});
