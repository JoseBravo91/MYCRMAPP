'use client';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Una sola renovación en curso aunque varias peticiones reciban 401 a la vez.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function apiFetch<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const doFetch = () =>
    fetch(url, {
      ...rest,
      credentials: 'same-origin',
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

  let res = await doFetch();

  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    if (await refreshSession()) {
      res = await doFetch();
    } else {
      // Recarga completa intencional: descarta cualquier estado de la sesión anterior en memoria.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      throw new ApiError(401, 'Sesión expirada');
    }
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Error inesperado', body.details);
  return body as T;
}
