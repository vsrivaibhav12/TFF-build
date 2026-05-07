import { requireRole } from '@/lib/auth/require-role';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { listTasks } from '@/lib/repositories/tasks';
import { listQueries } from '@/lib/repositories/queries';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientPortalDashboard() {
  const me = await requireRole('client');
  const [clients, tasks, queries] = await Promise.all([
    listAccessibleClients(),
    listTasks({ status: ['awaiting_client', 'completed'], limit: 8 }),
    listQueries({ mineOnly: true, userId: me.id }),
  ]);
  const awaiting = tasks.filter((t: any) => t.status === 'awaiting_client').length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome{me.full_name ? `, ${me.full_name.split(' ')[0]}` : ''}</h1>
        <p className="text-zinc-500 mt-1">Your compliance, queries and analytics in one place.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Metric label="Awaiting your action" value={awaiting} variant="warning" />
        <Metric label="Open queries" value={queries.filter((q: any) => q.status !== 'resolved' && q.status !== 'closed').length} variant="teal" />
        <Metric label="Linked entities" value={clients.length} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks awaiting you</h2>
          <Link href="/portal/tasks" className="text-sm text-teal-700 hover:underline inline-flex items-center gap-1">All tasks <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {tasks.filter((t: any) => t.status === 'awaiting_client').length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">Nothing waiting on you. We’ll let you know.</div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y">{tasks.filter((t: any) => t.status === 'awaiting_client').map((t: any) => (
            <Link key={t.id} href={`/portal/tasks/${t.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50"><div><div className="font-medium">{t.title}</div><div className="text-xs text-zinc-500">{t.clients?.business_name} · due {formatDateIST(t.due_date)}</div></div><Badge variant="warning">awaiting client</Badge></Link>
          ))}</div>
        )}
      </section>
    </div>
  );
}
function Metric({ label, value, variant }: { label: string; value: number; variant?: 'warning' | 'teal' }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 bg-white">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
