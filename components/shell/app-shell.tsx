'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Layout,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  BarChart3,
  Calendar,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Icon registry: serializable string keys, resolved on the client.
const ICONS: Record<string, LucideIcon> = {
  layout: Layout,
  dashboard: LayoutDashboard,
  users: Users,
  briefcase: Briefcase,
  file: FileText,
  message: MessageSquare,
  chart: BarChart3,
  calendar: Calendar,
  settings: Settings,
  shield: ShieldCheck,
};

export type NavIconName = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export default function AppShell({
  user,
  role,
  nav,
  children,
}: {
  user: { email: string; full_name: string | null; role: string };
  role: 'admin' | 'team' | 'client';
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  const roleBadge =
    role === 'admin' ? 'Admin' : role === 'team' ? 'Team' : 'Client portal';

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
        <div className="px-6 py-6 border-b border-zinc-200">
          <Link href="/" className="text-base font-bold tracking-tight text-zinc-900">
            The <span className="text-teal-600">Fiscal Fulcrum</span>
          </Link>
          <div className="mt-1 text-xs text-zinc-500">{roleBadge}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => {
            const Icon = ICONS[n.icon] ?? Layout;
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                data-testid={`nav-${n.label.toLowerCase().replace(/ /g, '-')}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white text-teal-700 border border-zinc-200'
                    : 'text-zinc-600 hover:bg-white hover:text-zinc-900'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-teal-600' : 'text-zinc-400')} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 px-4 py-4">
          <div className="text-xs text-zinc-500 truncate">{user.email}</div>
          <button
            onClick={logout}
            data-testid="logout-btn"
            className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <Link href="/" className="text-sm font-bold">
          The <span className="text-teal-600">Fiscal Fulcrum</span>
        </Link>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-2" aria-label="menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-white pt-14">
          <nav className="px-4 py-2 space-y-1">
            {nav.map((n) => {
              const Icon = ICONS[n.icon] ?? Layout;
              const active = pathname === n.href || pathname.startsWith(n.href + '/');
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium',
                    active ? 'bg-zinc-100 text-teal-700' : 'text-zinc-700'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              data-testid="logout-btn"
              className="flex items-center gap-3 px-3 py-3 text-base text-zinc-700 w-full"
            >
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 px-6 md:px-8 py-8 md:py-12 pt-20 md:pt-12">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
