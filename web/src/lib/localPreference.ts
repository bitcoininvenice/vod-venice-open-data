'use client';

import { useSyncExternalStore } from 'react';

/**
 * Preferenze per singolo visitatore salvate in localStorage, lette con useSyncExternalStore:
 * il rendering lato server usa `serverValue` e il client si allinea senza setState negli effetti.
 * Se lo storage non è disponibile (navigazione privata, blocchi) il valore resta in memoria.
 */
const listeners = new Set<() => void>();
const memory = new Map<string, string | null>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key) memory.delete(e.key);
    callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function readPreference(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage non disponibile: resta il valore in memoria per la sessione
  }
  listeners.forEach((l) => l());
}

export function usePreference(key: string, serverValue: string | null = null): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readPreference(key),
    () => serverValue,
  );
}
