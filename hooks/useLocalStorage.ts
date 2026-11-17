'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // almacenamiento no disponible (modo privado)
  }
}

/**
 * Persistencia de preferencias de interfaz (vista, filtros).
 * Nunca debe usarse para tokens o datos sensibles: esos viven en cookies httpOnly.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const update = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // se ignora: la preferencia simplemente no persiste
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, update] as const;
}
