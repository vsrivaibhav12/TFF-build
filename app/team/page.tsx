import { requireRole } from '@/lib/auth/require-role';
import { listTasks, countTasksByStatus } from '@/lib/repositories/tasks';
import { listAccessibleClients } from '@/lib/repositories/clients';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamWorkspace() {
  await requireRole(['team', 'admin']);
  const [counts, dueSoon, clients] = await Promise.all([
    countTasksByStatus(),
    listTasks({ status: ['pending', 'awaiting_client', 'in_progress', 'review'], limit: 8 }),
    listAccessibleClients(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-zinc-500 mt-1">Your assigned clients, tasks and compliance pipeline.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', value: counts.pending ?? 0, variant: 'outline' as const },
          { label: 'Awaiting client', value: counts.awaiting_client ?? 0, variant: 'warning' as const },
          { label: 'In progress', value: counts.in_progress ?? 0, variant: 'teal' as const },
          { label: 'In review', value: counts.review ?? 0, variant: 'warning' as const },
          { label: 'Completed', value: counts.completed ?? 0, variant: 'success' as const },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 p-5 bg-white">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">{m.label}</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{m.value}</div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks needing attention</h2>
          <Link href="/team/tasks" className="text-sm text-teal-700 hover:underline inline-flex items-center gap-1">All tasks <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {dueSoon.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-8 text-sm text-zinc-500 bg-zinc-50">No open tasks. Either you’re all caught up or no tasks have been generated yet.</div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y">
            {dueSoon.map((t: any) => (
              <Link key={t.id} href={`/team/tasks/${t.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50" data-testid={`task-row-${t.id}`}>
                <div>
                  <div className="font-medium text-zinc-900">{t.title}</div>
                  <div className="text-xs text-zinc-500">{t.clients?.business_name} · due {formatDateIST(t.due_date)}</div>
                </div>
                <Badge variant={statusVariant(t.status)}>{t.status.replace('_', ' ')}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Clients you support</h2>
          <Link href="/team/clients" className="text-sm text-teal-700 hover:underline">All clients</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{clients.slice(0, 6).map((c: any) => (
          <Link key={c.id} href={`/team/clients/${c.id}`} className="rounded-xl border border-zinc-200 p-5 bg-white hover:border-zinc-300">
            <div className="font-medium text-zinc-900">{c.business_name}</div>
            <div className="text-xs text-zinc-500 mt-1">{c.lifecycle_stage.replace(/_/g, ' ')}</div>
          </Link>
        ))}</div>
      </section>
    </div>
  );
}

function statusVariant(s: string): 'outline' | 'warning' | 'teal' | 'success' {
  if (s === 'completed') return 'success';
  if (s === 'awaiting_client' || s === 'review') return 'warning';
  if (s === 'in_progress') return 'teal';
  return 'outline';
}
