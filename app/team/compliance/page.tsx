import Link from 'next/link';
import { listAllUpcomingDueDates } from '@/lib/repositories/compliance';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamCompliancePage() {
  let agg: any = { gst: [], tds: [], it: [] };
  try {
    agg = await listAllUpcomingDueDates(45);
  } catch (e) {
    // Repo may fail if RLS prevents cross-client read; show empty state.
    agg = { gst: [], tds: [], it: [] };
  }
  const items = [
    ...agg.gst.map((x: any) => ({ ...x, kind: 'GST', label: `${x.return_type} ${x.period_month}/${x.period_year}` })),
    ...agg.tds.map((x: any) => ({ ...x, kind: 'TDS', label: `Q${x.period_quarter} ${x.period_year}` })),
    ...agg.it.map((x: any) => ({ ...x, kind: 'IT', label: `FY ${x.fy_ending_year}` })),
  ].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance pipeline</h1>
        <p className="text-zinc-500 mt-1">Open filings due in the next 45 days, across your assigned clients.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">Nothing due in the next 45 days. Either you’re all clear, or no filing records have been entered yet — add them on each client’s Compliance tab.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">{items.map((i: any) => (
          <Link key={`${i.kind}-${i.id}`} href={`/team/clients/${i.client_id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50">
            <div><div className="font-medium">{i.clients?.business_name} · <Badge variant="outline">{i.kind}</Badge> {i.label}</div><div className="text-xs text-zinc-500 mt-1">due {formatDateIST(i.due_date)}</div></div>
            <Badge variant={i.status === 'filed' ? 'success' : 'warning'}>{i.status}</Badge>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
