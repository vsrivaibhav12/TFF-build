import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin');
  return (
    <AppShell
      user={user}
      role="admin"
      nav={[
        // v3 sidebar — flat. No clusters.
        { href: '/admin',                    label: 'Workspace',             icon: 'dashboard' },
        { href: '/admin/compliance',         label: 'Compliance Dashboard', icon: 'chart' },
        { href: '/admin/calendar',           label: 'Compliance Calendar',  icon: 'calendar' },
        { href: '/admin/clients',            label: 'Clients',              icon: 'users' },
        { href: '/admin/services',           label: 'Services',             icon: 'settings' },
        { href: '/admin/tasks',              label: 'Tasks',                icon: 'briefcase' },
        { href: '/admin/documents',          label: 'Documents',            icon: 'file' },
        { href: '/admin/queries',            label: 'Queries',              icon: 'message' },
        { href: '/admin/notices',            label: 'Notices',              icon: 'scroll' },
        { href: '/admin/hearings',           label: 'Hearings',             icon: 'scroll' },
        { href: '/admin/bizlens',            label: 'BizLens',              icon: 'chart' },
        { href: '/admin/vcfo',               label: 'vCFO',                 icon: 'trending' },
        { href: '/admin/dsc',                label: 'DSC',                  icon: 'shield' },
        { href: '/admin/credentials',        label: 'Credentials',          icon: 'key' },
        { href: '/admin/attendance',         label: 'Attendance',           icon: 'clipboard' },
        { href: '/admin/leave',              label: 'Leave',                icon: 'clipboard' },
        { href: '/admin/payroll',            label: 'Payroll',              icon: 'wallet' },
        { href: '/admin/team',               label: 'Team',                 icon: 'shield' },
        { href: '/admin/audit',              label: 'Audit',                icon: 'scroll' },
        { href: '/admin/settings/billing-entities', label: 'Billing Entities', icon: 'wallet' },
        { href: '/admin/settings',           label: 'Settings',             icon: 'settings' },
      ]}
    >
      <div data-admin-only>{children}</div>
    </AppShell>
  );
}
