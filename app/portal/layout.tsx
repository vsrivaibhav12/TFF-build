import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('client');
  return (
    <AppShell
      user={user}
      role="client"
      nav={[
        { href: '/portal', label: 'Dashboard', icon: 'layout' },
        { href: '/portal/tasks', label: 'My Tasks', icon: 'briefcase' },
        { href: '/portal/documents', label: 'Documents', icon: 'file' },
        { href: '/portal/queries', label: 'Queries', icon: 'message' },
        { href: '/portal/bizlens', label: 'BizLens', icon: 'chart' },
      ]}
    >
      {children}
    </AppShell>
  );
}
