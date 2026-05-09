import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['team', 'admin']);
  return (
    <AppShell
      user={user}
      role="team"
      nav={[
        // v3 team sidebar — flat
        { href: '/team',            label: 'Workspace',             icon: 'dashboard' },
        { href: '/team/compliance', label: 'Compliance Dashboard',  icon: 'chart' },
        { href: '/team/calendar',   label: 'Compliance Calendar',   icon: 'calendar' },
        { href: '/team/clients',    label: 'Clients',               icon: 'users' },
        { href: '/team/tasks',      label: 'Tasks',                 icon: 'briefcase' },
        { href: '/team/documents',  label: 'Documents',             icon: 'file' },
        { href: '/team/queries',    label: 'Queries',               icon: 'message' },
        { href: '/team/notices',    label: 'Notices',               icon: 'scroll' },
        { href: '/team/hearings',   label: 'Hearings',              icon: 'scroll' },
        { href: '/team/bizlens',    label: 'BizLens',               icon: 'chart' },
        { href: '/team/vcfo',       label: 'vCFO',                  icon: 'trending' },
        { href: '/team/attendance', label: 'Attendance',            icon: 'clipboard' },
        { href: '/team/leave',      label: 'Leave',                 icon: 'clipboard' },
      ]}
    >
      {children}
    </AppShell>
  );
}
