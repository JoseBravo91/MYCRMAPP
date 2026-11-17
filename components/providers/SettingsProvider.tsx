'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tema } from '@/lib/theme';

export interface ClientSettings {
  tema: Tema;
  marca: { nombre: string; logoUrl: string | null; mostrarNombre: boolean };
  /** ubicación → URL del icono asignado */
  iconos: Record<string, string>;
}

const SettingsContext = createContext<ClientSettings | null>(null);

export function SettingsProvider({ value, children }: { value: ClientSettings; children: ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): ClientSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}
