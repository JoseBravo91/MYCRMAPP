'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { AssetImage, type IconSize } from './AssetImage';

/** Icono configurable por ubicación. Si el administrador no asignó uno, no se muestra nada. */
export function AppIcon({ slot, size = 'md', className }: { slot: string; size?: IconSize; className?: string }) {
  const { iconos } = useSettings();
  return <AssetImage src={iconos[slot]} size={size} className={className} />;
}

export function useHasIcon(slot: string): boolean {
  return !!useSettings().iconos[slot];
}
