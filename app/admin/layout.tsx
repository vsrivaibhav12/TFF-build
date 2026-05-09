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
        { href: '/admin/dsc', label: 'DSC Vault', icon: 'shield' },
        { href: '/admin/credentials', label: 'Credentials', icon: 'key' },
        { href: '/admin/payroll', label: 'Payroll', icon: 'wallet' },
        { href: '/admin/bizlens', label: 'BizLens', icon: 'chart' },
        { href: '/admin/audit', label: 'Audit', icon: 'scroll' },
      ]}
    >
      {/* Tag the entire admin tree as admin-only so View-as-client toggle dims it */}
      <div data-admin-only>{children}</div>
    </AppShell>
  );
}
