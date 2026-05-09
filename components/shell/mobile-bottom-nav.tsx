'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, Calendar, FileText, MessageSquare } from 'lucide-react';

/**
 * Mobile-only (<768px) bottom-tab nav for the client portal.
 * Always shows the 5 universal tabs even if some are visibility-disabled
 * (clicks on disabled modules will hit the visibility gate and redirect).
 */
const TABS = [
  { href: '/portal', label: 'Home', icon: LayoutDashboard },
  { href: '/portal/tasks', label: 'Tasks', icon: Briefcase },
  { href: '/portal/calendar', label: 'Calendar', icon: Calendar },
  { href: '/portal/documents', label: 'Docs', icon: FileText },
  { href: '/portal/queries', label: 'Queries', icon: MessageSquare },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-zinc-200 grid grid-cols-5 pb-[env(safe-area-inset-bottom,0)]"
    >
      {TABS.map((t) => {
        const active = t.href === '/portal' ? pathname === '/portal' : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium min-h-[56px]',
              active ? 'text-teal-700' : 'text-zinc-500',
            )}
            data-testid={`bottom-tab-${t.label.toLowerCase()}`}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
