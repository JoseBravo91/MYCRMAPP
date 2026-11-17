'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface Result<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/** GET declarativo con estados de carga/error. Pasar url=null para no ejecutar. */
export function useFetch<T>(url: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = url ? `${url}#${version}` : null;

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    apiFetch<T>(url)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch(
        (err: unknown) =>
          !cancelled &&
          setResult((prev) => ({
            key,
            data: prev?.data ?? null,
            error: err instanceof ApiError ? err.message : 'Error de red',
          })),
      );
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  // Mientras llega la respuesta de una URL nueva se conservan los datos anteriores
  // (evita parpadeos al paginar) y `loading` indica que hay una petición en curso.
  return {
    data: result?.data ?? null,
    error: result?.key === key ? result.error : null,
    loading: key !== null && result?.key !== key,
    refetch,
  };
}
