import { requireRole } from '@/lib/auth/require-role';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { listTasks } from '@/lib/repositories/tasks';
import { listQueries } from '@/lib/repositories/queries';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import InsightStrip from '@/components/insights/insight-strip';
import {
  getClientVisibleStatus,
  CLIENT_VISIBLE_LABELS,
  CLIENT_VISIBLE_VARIANTS,
} from '@/lib/services/client-visible-status';

export const dynamic = 'force-dynamic';

export default async function ClientPortalDashboard() {
  const me = await requireRole('client');
  const [clients, tasks, queries] = await Promise.all([
    listAccessibleClients(),
    listTasks({ limit: 20 }), // RLS scoped to this client's rows
    listQueries({ mineOnly: true, userId: me.id }),
  ]);

  const tasksWithStatus = tasks.map((t: any) => ({ ...t, _cs: getClientVisibleStatus(t) }));
  const awaitingYou = tasksWithStatus.filter(
    (t: any) => t._cs === 'awaiting_your_data' || t._cs === 'awaiting_your_approval',
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{me.full_name ? `, ${me.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-zinc-500 mt-1">
          Your compliance, queries and analytics in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Metric label="Awaiting you" value={awaitingYou.length} variant="warning" />
        <Metric
          label="Open queries"
          value={queries.filter(
            (q: any) => q.status !== 'resolved' && q.status !== 'closed',
          ).length}
          variant="teal"
        />
        <Metric label="Linked entities" value={clients.length} />
      </div>

      {clients[0]?.id && <InsightStrip clientId={clients[0].id} limit={3} />}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Awaiting you</h2>
          <Link
            href="/portal/tasks"
            className="text-sm text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            All tasks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {awaitingYou.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">
            Nothing waiting on you right now. We&apos;ll let you know.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y">
            {awaitingYou.map((t: any) => (
              <Link
                key={t.id}
                href={`/portal/tasks/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-zinc-50"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-zinc-500">
                    {t.clients?.business_name} · due {formatDateIST(t.due_date)}
                  </div>
                </div>
                <Badge variant={CLIENT_VISIBLE_VARIANTS[t._cs as keyof typeof CLIENT_VISIBLE_VARIANTS] as any}>
                  {CLIENT_VISIBLE_LABELS[t._cs as keyof typeof CLIENT_VISIBLE_LABELS]}
                </Badge>
              </Link>
            ))}
          </div>
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
