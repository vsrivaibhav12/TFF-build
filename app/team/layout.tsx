import { requireRole } from '@/lib/auth/require-role';
import AppShell from '@/components/shell/app-shell';
import { LayoutDashboard, Users, Briefcase, FileText, BarChart3, Calendar, MessageSquare } from 'lucide-react';

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['team', 'admin']);
  return (
    <AppShell
      user={user}
      role="team"
      nav={[
        { href: '/team', label: 'Workspace', icon: LayoutDashboard },
        { href: '/team/clients', label: 'Clients', icon: Users },
        { href: '/team/tasks', label: 'Tasks', icon: Briefcase },
        { href: '/team/compliance', label: 'Compliance', icon: Calendar },
        { href: '/team/documents', label: 'Documents', icon: FileText },
        { href: '/team/queries', label: 'Queries', icon: MessageSquare },
        { href: '/team/bizlens', label: 'BizLens', icon: BarChart3 },
      ]}
    >
      {children}
    </AppShell>
  );
}
