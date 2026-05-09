import { requireRole } from '@/lib/auth/require-role';
import { listTasks, countTasksByStatus } from '@/lib/repositories/tasks';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { listAllUpcomingDueDates } from '@/lib/repositories/compliance';
import { listAllNotices, listHearings } from '@/lib/repositories/notices';
import { listExpiringDsc } from '@/lib/repositories/dsc';
import ComplianceCalendar from './calendar/calendar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Calendar-first Workspace landing.
 * The calendar is what a CA opens every morning; pipeline metrics sit beneath.
 */
export default async function TeamWorkspace() {
  await requireRole(['team', 'admin']);
  const [counts, dueSoon, clients, agg, notices, hearings, dsc] = await Promise.all([
    countTasksByStatus(),
    listTasks({ status: ['pending', 'in_progress'], limit: 5 }),
    listAccessibleClients(),
    listAllUpcomingDueDates(60),
    listAllNotices(),
    listHearings(),
    listExpiringDsc(60),
  ]);

  // Build calendar events (same shape as /team/calendar)
  const events: Array<{ date: string; type: string; label: string; clientName: string; severity: 'info' | 'warning' | 'danger' }> = [];
  for (const f of agg.gst as any[]) events.push({ date: f.due_date, type: 'GST', label: `${f.return_type} ${f.period_month}/${f.period_year}`, clientName: f.clients?.business_name ?? '', severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const f of agg.tds as any[]) events.push({ date: f.due_date, type: 'TDS', label: `Q${f.period_quarter} ${f.period_year}`, clientName: f.clients?.business_name ?? '', severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const f of agg.it as any[]) events.push({ date: f.due_date, type: 'IT', label: `FY ${f.fy_ending_year}`, clientName: f.clients?.business_name ?? '', severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const n of notices as any[]) if (n.due_date) events.push({ date: n.due_date, type: 'Notice', label: n.subject ?? n.notice_number ?? n.notice_type, clientName: n.clients?.business_name ?? '', severity: n.status === 'closed' ? 'info' : 'warning' });
  for (const h of hearings as any[]) if (h.hearing_scheduled_date) events.push({ date: h.hearing_scheduled_date, type: 'Hearing', label: h.subject ?? h.hearing_type ?? 'Hearing', clientName: h.clients?.business_name ?? '', severity: 'warning' });
  for (const d of dsc as any[]) events.push({ date: d.expiry_date, type: 'DSC', label: `${d.holder_name} expires`, clientName: d.clients?.business_name ?? '', severity: 'danger' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-zinc-500 mt-1">What needs your attention today, this week, this month.</p>
      </div>

      {/* Calendar first \u2014 the morning glance */}
      <ComplianceCalendar events={events} />

      {/* Pipeline metrics + sidebar (beneath calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Pipeline</h2>
            <Link href="/team/tasks" className="text-xs text-teal-700 hover:underline">All tasks <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Pending', value: counts.pending ?? 0 },
              { label: 'In progress', value: counts.in_progress ?? 0 },
              { label: 'Cancelled', value: counts.cancelled ?? 0 },
              { label: 'Completed', value: counts.completed ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-zinc-50 p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{m.label}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold mb-4">Tasks needing attention</h2>
          {dueSoon.length === 0 ? (
            <div className="text-sm text-zinc-500">All caught up.</div>
          ) : (
            <ul className="space-y-2">{dueSoon.map((t: any) => (
              <li key={t.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                <Link href={`/team/tasks/${t.id}`} className="block text-sm hover:text-teal-700">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-zinc-500">{t.clients?.business_name} \u00b7 due {formatDateIST(t.due_date)}</div>
                </Link>
              </li>
            ))}</ul>
          )}
        </div>
      </div>

      {/* Quick client access \u2014 only first 6, full list at /team/clients */}
      {clients.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent clients</h2>
            <Link href="/team/clients" className="text-xs text-teal-700 hover:underline">All clients <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{clients.slice(0, 6).map((c: any) => (
            <Link key={c.id} href={`/team/clients/${c.id}`} className="rounded-lg border border-zinc-200 p-4 bg-white hover:border-teal-400 hover:bg-zinc-50">
              <div className="font-medium text-zinc-900 truncate">{c.business_name}</div>
              <div className="text-xs text-zinc-500 mt-1">
                <Badge variant="outline" className="mr-1">{c.lifecycle_stage}</Badge>
              </div>
            </Link>
          ))}</div>
        </section>
      )}
    </div>
  );
}
