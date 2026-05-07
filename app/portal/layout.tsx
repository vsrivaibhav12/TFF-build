import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';
import { Briefcase, FileText, MessageSquare, BarChart3, Layout } from 'lucide-react';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('client');
  return (
    <AppShell
      user={user}
      role="client"
      nav={[
        { href: '/portal', label: 'Dashboard', icon: Layout },
        { href: '/portal/tasks', label: 'My Tasks', icon: Briefcase },
        { href: '/portal/documents', label: 'Documents', icon: FileText },
        { href: '/portal/queries', label: 'Queries', icon: MessageSquare },
        { href: '/portal/bizlens', label: 'BizLens', icon: BarChart3 },
      ]}
    >
      {children}
    </AppShell>
  );
}
