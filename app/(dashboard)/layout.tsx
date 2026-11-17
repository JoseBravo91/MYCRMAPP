import { requirePageUser } from '@/lib/auth/session';
import { filtrarMenu, getMenuCompleto } from '@/lib/services/menu';
import { AppShell } from '@/components/ui/AppShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const menu = filtrarMenu(await getMenuCompleto(), user.rol);
  return (
    <AppShell user={user} menu={menu}>
      {children}
    </AppShell>
  );
}
