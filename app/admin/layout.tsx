import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin');
  return (
    <AppShell
      user={user}
      role="admin"
      nav={[
        { href: '/admin', label: 'Firm Dashboard', icon: 'dashboard' },
        { href: '/admin/clients', label: 'Clients', icon: 'users' },
        { href: '/admin/services', label: 'Services', icon: 'settings' },
        { href: '/admin/team', label: 'Team', icon: 'shield' },
        { href: '/admin/bizlens', label: 'BizLens', icon: 'chart' },
      ]}
    >
      {children}
    </AppShell>
  );
}
