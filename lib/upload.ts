'use client';

import { apiFetch } from '@/lib/api-client';

export interface AssetSubido {
  id: string;
  nombre: string;
  url: string;
}

export function subirAsset(blob: Blob, tipo: 'ICON' | 'LOGO', nombre: string): Promise<AssetSubido> {
  const form = new FormData();
  form.append('archivo', blob, `${nombre}.${blob.type.split('/')[1] ?? 'png'}`);
  form.append('tipo', tipo);
  form.append('nombre', nombre);
  return apiFetch<AssetSubido>('/api/assets', { method: 'POST', body: form });
}

export function subirAvatar(usuarioId: string, blob: Blob): Promise<{ avatarId: string; url: string }> {
  const form = new FormData();
  form.append('archivo', blob, `avatar.${blob.type.split('/')[1] ?? 'png'}`);
  return apiFetch(`/api/usuarios/${usuarioId}/avatar`, { method: 'POST', body: form });
}
