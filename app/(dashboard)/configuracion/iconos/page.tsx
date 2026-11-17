import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { getAppSettings } from '@/lib/settings';
import { IconsManager } from '@/components/config/IconsManager';

export const metadata: Metadata = { title: 'Iconos' };

export default async function IconosPage() {
  await requirePageUser(['ADMIN']);
  const { iconos } = await getAppSettings();
  return <IconsManager asignados={iconos} />;
}
