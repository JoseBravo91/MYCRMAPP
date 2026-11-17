import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { getMenuCompleto } from '@/lib/services/menu';
import { MenuEditor } from '@/components/config/MenuEditor';

export const metadata: Metadata = { title: 'Menú' };

export default async function MenuConfigPage() {
  await requirePageUser(['ADMIN']);
  return <MenuEditor inicial={await getMenuCompleto()} />;
}
