import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';
import { LayoutDashboard, Users, Settings, ShieldCheck, BarChart3 } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin');
  return (
    <AppShell
      user={user}
      role="admin"
      nav={[
        { href: '/admin', label: 'Firm Dashboard', icon: LayoutDashboard },
        { href: '/admin/clients', label: 'Clients', icon: Users },
        { href: '/admin/services', label: 'Services', icon: Settings },
        { href: '/admin/team', label: 'Team', icon: ShieldCheck },
        { href: '/admin/bizlens', label: 'BizLens', icon: BarChart3 },
      ]}
    >
      {children}
    </AppShell>
  );
}
