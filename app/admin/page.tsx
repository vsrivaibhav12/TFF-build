import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyINR, formatDateIST } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight, Briefcase, Users, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const sb = createClient();

  // KPIs
  const [{ count: activeClients }, { count: openTasks }, { count: overdueTasks }, { count: dscExpiring }, { data: recentAudit }] = await Promise.all([
    sb.from('clients').select('id', { head: true, count: 'exact' }).eq('is_deleted', false),
    sb.from('tasks').select('id', { head: true, count: 'exact' }).eq('is_deleted', false).in('status', ['pending', 'in_progress', 'review', 'awaiting_client']),
    sb.from('compliance_status').select('id', { head: true, count: 'exact' }).eq('is_overdue', true),
    sb.from('dsc_records').select('id', { head: true, count: 'exact' }).eq('is_deleted', false).eq('status', 'active').lte('expiry_date', new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)),
    sb.from('global_audit_log').select('id, action, entity_type, entity_id, performed_at, performed_by, users_profile(full_name)').order('performed_at', { ascending: false }).limit(15),
  ]);

  // Compliance heatmap data — last 6 months filing rates
  const { data: lastSixGst } = await sb
    .from('compliance_status')
    .select('client_id, status, due_date, clients(business_name)')
    .order('due_date', { ascending: false })
    .limit(200);

  const heatmap: Record<string, { name: string; total: number; filed: number }> = {};
  for (const r of lastSixGst ?? []) {
    const cid = (r as any).client_id;
    if (!heatmap[cid]) heatmap[cid] = { name: (r as any).clients?.business_name ?? '', total: 0, filed: 0 };
    heatmap[cid].total++;
    if ((r as any).status === 'filed') heatmap[cid].filed++;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firm Dashboard</h1>
        <p className="text-zinc-500 mt-1">A live snapshot of throughput, compliance health and recent activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={<Users className="h-5 w-5 text-teal-700" />} label="Active clients" value={activeClients ?? 0} />
        <Kpi icon={<Briefcase className="h-5 w-5 text-teal-700" />} label="Open tasks" value={openTasks ?? 0} />
        <Kpi icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="Overdue filings" value={overdueTasks ?? 0} variant="warning" />
        <Kpi icon={<ShieldCheck className="h-5 w-5 text-red-700" />} label="DSC expiring (30d)" value={dscExpiring ?? 0} variant="danger" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-teal-600" /> Compliance health by client</h2>
            <Link href="/admin/clients" className="text-xs text-teal-700 hover:underline">All clients <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          {Object.keys(heatmap).length === 0 ? (
            <div className="rounded-lg bg-zinc-50 p-6 text-sm text-zinc-500">No compliance entries yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {Object.entries(heatmap).slice(0, 12).map(([cid, h]) => {
                const score = h.total > 0 ? Math.round((h.filed / h.total) * 100) : 0;
                return (
                  <div key={cid} className="flex items-center gap-3 py-2">
                    <div className="flex-1 min-w-0 text-sm font-medium truncate">{h.name}</div>
                    <div className="w-32 h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className={`h-full ${score >= 90 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                    </div>
                    <div className="w-12 text-right text-xs tabular-nums">{score}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold mb-4">Recent activity</h2>
          {(recentAudit ?? []).length === 0 ? (
            <div className="text-sm text-zinc-500">Nothing yet.</div>
          ) : (
            <ul className="space-y-3">
              {(recentAudit ?? []).slice(0, 8).map((a: any) => (
                <li key={a.id} className="text-xs">
                  <div className="font-mono text-zinc-700">{a.action}</div>
                  <div className="text-zinc-500">{a.entity_type} · by {a.users_profile?.full_name ?? 'system'} · {formatDateIST(a.performed_at)}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <Link href="/admin/audit" className="text-xs text-teal-700 hover:underline">All audit entries <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon, label, value, variant }: { icon: React.ReactNode; label: string; value: number; variant?: 'warning' | 'danger' }) {
  const ring = variant === 'warning' ? 'border-amber-200 bg-amber-50' : variant === 'danger' ? 'border-red-200 bg-red-50' : 'border-zinc-200 bg-white';
  return (
    <div className={`rounded-xl border p-5 ${ring}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
