'use client';

import { useCallback } from 'react';
import { useFetch } from './useFetch';
import { subirAsset } from '@/lib/upload';

export interface IconAsset {
  id: string;
  nombre: string;
  url: string;
  bytes: number;
  _count: { itemsDeMenu: number };
}

export function useIconLibrary(enabled = true) {
  const { data, loading, error, refetch } = useFetch<{ data: IconAsset[] }>(enabled ? '/api/assets?tipo=ICON' : null);

  const subir = useCallback(
    async (blob: Blob, nombre: string) => {
      const asset = await subirAsset(blob, 'ICON', nombre);
      refetch();
      return asset;
    },
    [refetch],
  );

  return { iconos: data?.data ?? [], loading, error, refetch, subir };
}
