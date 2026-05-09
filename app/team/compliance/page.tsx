import { loadComplianceDashboard } from '@/lib/repositories/compliance-dashboard';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, Briefcase, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  gst: 'GST', tds: 'TDS', tcs: 'TCS', it: 'Income Tax', roc: 'ROC',
  pf: 'PF', esi: 'ESI', pt: 'PT', other: 'Other',
};

export default async function ComplianceDashboardPage() {
  const cells = await loadComplianceDashboard({ horizonMonths: 6 });
  const grouped: Record<string, typeof cells> = {};
  for (const c of cells) {
    grouped[c.service_kind] = grouped[c.service_kind] ?? [];
    grouped[c.service_kind].push(c);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            Statutory work across all clients, by service and period. Click any cell to drill into the underlying tasks.
          </p>
        </div>
        <Link
          href="/team/calendar"
          className="inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
        >
          <CalendarIcon className="h-4 w-4" /> Calendar view
        </Link>
      </div>

      {cells.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center">
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            No compliance events generated yet. Set compliance profiles on at least one client and{' '}
            <Link href="/admin/settings/compliance-rules" className="text-teal-700 hover:underline">refresh the rules engine</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-6" data-testid="compliance-dashboard">
          {Object.entries(grouped).map(([kind, rows]) => (
            <section key={kind} className="space-y-2">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold uppercase tracking-wider text-zinc-500">
                  {KIND_LABEL[kind] ?? kind}
                </h2>
                <span className="text-xs text-zinc-400">{rows.length} period{rows.length === 1 ? '' : 's'}</span>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr className="text-left text-zinc-500 text-xs">
                      <th className="px-3 py-2 font-medium">Service</th>
                      <th className="px-3 py-2 font-medium">Period</th>
                      <th className="px-3 py-2 font-medium">Due</th>
                      <th className="px-3 py-2 font-medium text-center">Total</th>
                      <th className="px-3 py-2 font-medium text-center">Upcoming</th>
                      <th className="px-3 py-2 font-medium text-center">Going</th>
                      <th className="px-3 py-2 font-medium text-center">Stuck</th>
                      <th className="px-3 py-2 font-medium text-center">Overdue</th>
                      <th className="px-3 py-2 font-medium text-center">Filed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((c) => (
                      <tr key={`${c.rule_code}-${c.period_label}`} data-testid={`grid-${c.rule_code}-${c.period_label}`}>
                        <td className="px-3 py-2 font-medium">
                          <div>{c.rule_name}</div>
                          <code className="text-[10px] text-zinc-400 font-mono">{c.rule_code}</code>
                        </td>
                        <td className="px-3 py-2 text-zinc-600">{c.period_label}</td>
                        <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{formatDateIST(c.period_due_date)}</td>
                        <td className="px-3 py-2 text-center font-medium tabular-nums">{c.total_clients}</td>
                        <td className="px-3 py-2 text-center"><Chip count={c.upcoming} variant="outline" icon={<Clock className="h-3 w-3" />} /></td>
                        <td className="px-3 py-2 text-center"><Chip count={c.task_created} variant="teal" icon={<Briefcase className="h-3 w-3" />} /></td>
                        <td className="px-3 py-2 text-center"><Chip count={c.stuck} variant="destructive" icon={<AlertTriangle className="h-3 w-3" />} /></td>
                        <td className="px-3 py-2 text-center"><Chip count={c.overdue} variant="warning" /></td>
                        <td className="px-3 py-2 text-center"><Chip count={c.filed} variant="success" icon={<CheckCircle2 className="h-3 w-3" />} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ count, variant, icon }: { count: number; variant: 'outline' | 'teal' | 'success' | 'warning' | 'destructive'; icon?: React.ReactNode }) {
  if (count === 0) return <span className="text-zinc-300">—</span>;
  return (
    <Badge variant={variant as any} className="inline-flex gap-1 items-center text-[11px] tabular-nums">
      {icon}
      {count}
    </Badge>
  );
}
