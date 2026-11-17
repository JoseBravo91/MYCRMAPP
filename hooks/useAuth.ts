'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useFetch } from './useFetch';
import type { SessionUser } from '@/lib/auth/session';

export function useLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }, [router]);

  return { logout, loggingOut };
}

/** Usuario autenticado consultado desde el cliente (la sesión persiste en cookies httpOnly). */
export function useAuth() {
  const { data, loading, refetch } = useFetch<{ user: SessionUser }>('/api/auth/me');
  const { logout, loggingOut } = useLogout();
  return { user: data?.user ?? null, loading, refetch, logout, loggingOut };
}
