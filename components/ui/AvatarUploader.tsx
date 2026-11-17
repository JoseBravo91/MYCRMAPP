'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { subirAvatar } from '@/lib/upload';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { ImageCropper } from './ImageCropper';
import { useToast } from './Toast';

interface Props {
  usuarioId: string;
  nombre: string;
  avatarId: string | null;
  /** Se llama tras subir o quitar la foto (además de refrescar la página) */
  onChange?: (avatarId: string | null) => void;
  compact?: boolean;
}

export function AvatarUploader({ usuarioId, nombre, avatarId, onChange, compact = false }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [actual, setActual] = useState(avatarId);
  const [open, setOpen] = useState(false);
  const [quitando, setQuitando] = useState(false);

  function aplicar(id: string | null, mensaje: string) {
    setActual(id);
    onChange?.(id);
    toast(mensaje);
    router.refresh();
  }

  async function quitar() {
    setQuitando(true);
    try {
      await apiFetch(`/api/usuarios/${usuarioId}/avatar`, { method: 'DELETE' });
      aplicar(null, 'Foto eliminada');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No se pudo quitar la foto', 'error');
    } finally {
      setQuitando(false);
    }
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-4' : 'gap-5'}`}>
      <Avatar nombre={nombre} avatarId={actual} size={compact ? 'lg' : 'xl'} className="shadow-card" />
      <div className="space-y-2">
        {!compact && (
          <div>
            <p className="text-sm font-semibold text-slate-900">Foto de perfil</p>
            <p className="text-xs text-slate-500">Se recorta en círculo a 256×256 px. PNG, JPG, WebP o SVG.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {actual ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {actual && (
            <Button size="sm" variant="ghost" loading={quitando} onClick={quitar}>
              Quitar
            </Button>
          )}
        </div>
      </div>
      <ImageCropper
        open={open}
        onClose={() => setOpen(false)}
        title="Encuadra la foto"
        outputHeight={256}
        format="image/webp"
        round
        previews={[32, 64, 112]}
        onConfirm={async (blob) => {
          const { avatarId: nuevo } = await subirAvatar(usuarioId, blob);
          aplicar(nuevo, 'Foto actualizada');
        }}
      />
    </div>
  );
}
