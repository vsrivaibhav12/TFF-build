import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  gst: 'GST', tds: 'TDS', tcs: 'TCS', it: 'Income Tax', roc: 'ROC',
  pf: 'PF', esi: 'ESI', pt: 'PT', other: 'Other',
};

/**
 * v3 Compliance Calendar.
 * Reads from compliance_calendar_events (refreshed by cron). Groups by month.
 */
export default async function TeamCalendarPage() {
  const sb = createClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonIso = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const { data: rows } = await sb
    .from('compliance_calendar_events')
    .select('id, client_id, rule_code, period_label, due_date, status, task_id, clients(business_name), compliance_calendar_rules(display_name, service_kind)')
    .gte('due_date', todayIso)
    .lte('due_date', horizonIso)
    .order('due_date', { ascending: true })
    .limit(500);

  const grouped: Record<string, any[]> = {};
  for (const r of rows ?? []) {
    const key = (r as any).due_date.slice(0, 7); // yyyy-mm
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(r);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarIcon className="h-7 w-7 text-teal-600" />
          Compliance Calendar
        </h1>
        <p className="text-zinc-500 mt-1">
          Statutory due dates auto-generated from client compliance profiles. Click any
          row to start working on it.
        </p>
      </div>

      {(rows?.length ?? 0) === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center">
          <CalendarIcon className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            No upcoming statutory events. Make sure each client has a compliance profile set
            (under Clients → entity → Compliance profile), then run a refresh from{' '}
            <Link href="/admin/settings/compliance-rules" className="text-teal-700 hover:underline">Settings → Compliance rules</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-6" data-testid="calendar-month-list">
          {Object.entries(grouped).map(([monthKey, items]) => {
            const [y, m] = monthKey.split('-');
            const monthLabel = new Date(`${y}-${m}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            return (
              <section key={monthKey} className="space-y-2">
                <h2 className="text-base font-semibold uppercase tracking-wider text-zinc-500">{monthLabel}</h2>
                <div className="rounded-xl border border-zinc-200 bg-white divide-y">
                  {items.map((it: any) => (
                    <div
                      key={it.id}
                      className="flex items-start gap-3 p-3 hover:bg-zinc-50"
                      data-testid={`cal-event-${it.id}`}
                    >
                      <div className="text-center w-14 shrink-0">
                        <div className="text-xl font-semibold tabular-nums">{it.due_date.slice(8, 10)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                          {new Date(it.due_date).toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {it.compliance_calendar_rules?.display_name ?? it.rule_code}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {it.clients?.business_name ?? '—'} · {it.period_label}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {KIND_LABEL[it.compliance_calendar_rules?.service_kind] ?? '—'}
                      </Badge>
                      {it.task_id ? (
                        <Link href={`/team/tasks/${it.task_id}`} className="text-xs text-teal-700 hover:underline">
                          Open task
                        </Link>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">{it.status}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
