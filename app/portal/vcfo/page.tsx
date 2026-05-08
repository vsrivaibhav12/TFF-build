import { ensureModuleVisible } from '@/lib/auth/portal-visibility';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyINR, formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalVcfoPage() {
  await ensureModuleVisible('portal.vcfo');
  const sb = createClient();
  const { data: snapshots } = await sb
    .from('vcfo_snapshots')
    .select('id, month, year, cash_in_bank, monthly_burn, revenue, advisor_notes, updated_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(6);
  const latest = (snapshots ?? [])[0] as any;
  const runway = latest?.cash_in_bank && latest?.monthly_burn ? Math.round((latest.cash_in_bank / latest.monthly_burn) * 10) / 10 : null;
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">vCFO</h1><p className="text-zinc-500 mt-1">Your runway, monthly burn and advisor notes.</p></div>
      {!latest ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">Your engagement team will publish the first vCFO snapshot here.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat label="Cash in bank" value={formatCurrencyINR(latest.cash_in_bank)} />
            <Stat label="Monthly burn" value={formatCurrencyINR(latest.monthly_burn)} />
            <Stat label="Runway" value={runway !== null ? `${runway} months` : '—'} highlight />
          </div>
          {latest.advisor_notes && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <div className="text-sm font-semibold mb-1">Advisor notes · {latest.month}/{latest.year}</div>
              <div className="text-sm text-zinc-700">{latest.advisor_notes}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-6 ${highlight ? 'border-teal-200 bg-teal-50' : 'border-zinc-200 bg-white'}`}><div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div><div className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? 'text-teal-800' : 'text-zinc-900'}`}>{value}</div></div>;
}
