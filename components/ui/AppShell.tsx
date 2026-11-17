'use client';

import { useState, type ReactNode } from 'react';
import type { SessionUser } from '@/lib/auth/session';
import type { MenuNodo } from '@/lib/modules';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppShell({ user, menu, children }: { user: SessionUser; menu: MenuNodo[]; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar menu={menu} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
