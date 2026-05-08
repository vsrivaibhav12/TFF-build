import { requireRole } from '@/lib/auth/require-role';
import { getVisibleModulesForCurrentClient } from '@/lib/auth/portal-visibility';
import AppShell, { type NavItem } from '@/components/shell/app-shell';

const FULL_NAV: Array<NavItem & { gate?: string }> = [
  { href: '/portal', label: 'Dashboard', icon: 'layout', gate: 'portal.dashboard' },
  { href: '/portal/tasks', label: 'My Tasks', icon: 'briefcase', gate: 'portal.tasks' },
  { href: '/portal/calendar', label: 'Calendar', icon: 'calendar', gate: 'portal.compliance_calendar' },
  { href: '/portal/documents', label: 'Documents', icon: 'file', gate: 'portal.documents' },
  { href: '/portal/queries', label: 'Queries', icon: 'message', gate: 'portal.queries' },
  { href: '/portal/notices', label: 'Notices', icon: 'scroll', gate: 'portal.notices' },
  { href: '/portal/projection', label: 'Tax Projection', icon: 'wallet', gate: 'portal.tax_projection' },
  { href: '/portal/bizlens', label: 'BizLens', icon: 'chart', gate: 'portal.bizlens' },
  { href: '/portal/vcfo', label: 'vCFO', icon: 'trending', gate: 'portal.vcfo' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('client');
  const visible = await getVisibleModulesForCurrentClient();
  const nav = FULL_NAV.filter((n) => !n.gate || visible.has(n.gate as any)).map(({ gate, ...rest }) => rest);
  return (
    <AppShell user={user} role="client" nav={nav}>
      {children}
    </AppShell>
  );
}
