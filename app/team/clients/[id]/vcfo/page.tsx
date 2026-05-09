import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/repositories/clients';
import { listVcfoSnapshots, listSolutionLog } from '@/lib/repositories/vcfo';
import { clientHasServiceKind } from '@/lib/auth/service-applicability';
import VcfoForm from './vcfo-form';
import SolutionForm from './solution-form';
import ServiceLocked from '@/components/shell/service-locked';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyINR, formatDateIST } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VcfoPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const allowed = await clientHasServiceKind(params.id, 'vcfo');
  if (!allowed) {
    return (
      <div className="space-y-6">
        <Link
          href={`/team/clients/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}
        </Link>
        <ServiceLocked
          kind="vcfo"
          clientId={params.id}
          clientName={(client as any).business_name}
          moduleLabel="vCFO advisory"
        />
      </div>
    );
  }
  const [snapshots, solutions] = await Promise.all([listVcfoSnapshots(params.id), listSolutionLog(params.id)]);
  const latest: any = snapshots[0];
  const runwayMonths = latest?.cash_in_bank && latest?.monthly_burn ? Math.round((latest.cash_in_bank / latest.monthly_burn) * 10) / 10 : null;
  const variance = latest?.budgeted_revenue && latest?.actual_revenue ? Math.round(((latest.actual_revenue - latest.budgeted_revenue) / latest.budgeted_revenue) * 100) : null;

  return (
    <div className="space-y-8">
      <Link href={`/team/clients/${params.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">vCFO</h1>
          <p className="text-zinc-500 mt-1">Cash, runway, variance and advisor notes for {(client as any).business_name}.</p>
        </div>
        <VcfoForm clientId={params.id} latest={latest} />
      </div>

      {!latest ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No snapshot yet. Add the first month’s numbers to start tracking runway and variance.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Cash in bank" value={formatCurrencyINR(latest.cash_in_bank)} />
          <Stat label="Monthly burn" value={formatCurrencyINR(latest.monthly_burn)} />
          <Stat label="Runway" value={runwayMonths !== null ? `${runwayMonths} mo` : '—'} highlight />
          <Stat label="Revenue variance" value={variance !== null ? `${variance > 0 ? '+' : ''}${variance}%` : '—'} />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Solution log</h2>
          <SolutionForm clientId={params.id} />
        </div>
        {solutions.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-6 bg-zinc-50 text-sm text-zinc-500">No advisor entries yet.</div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y">
            {solutions.map((s: any) => (
              <div key={s.id} className="p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.issue_category}</Badge>
                  <Badge variant={s.solution_status === 'implemented' ? 'success' : 'warning'} className="ml-auto">{s.solution_status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="mt-2 font-medium">{s.issue_description}</div>
                <div className="text-sm text-zinc-600 mt-1"><strong>Recommendation:</strong> {s.recommended_solution}</div>
                <div className="mt-2 text-xs text-zinc-400">Identified {formatDateIST(s.issue_identified_date)} · estimated impact {formatCurrencyINR(s.financial_impact_estimate, { compact: true })}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-6 ${highlight ? 'border-teal-200 bg-teal-50' : 'border-zinc-200 bg-white'}`}><div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div><div className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? 'text-teal-800' : 'text-zinc-900'}`}>{value}</div></div>;
}
