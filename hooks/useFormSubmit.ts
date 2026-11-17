'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api-client';

type FieldErrors = Record<string, string | undefined>;

/** Estado común de formularios: envío, error general y errores por campo devueltos por la API. */
export function useFormSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function run(action: () => Promise<void>) {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) {
          setFieldErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v?.[0]])));
        }
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, error, fieldErrors, run };
}
