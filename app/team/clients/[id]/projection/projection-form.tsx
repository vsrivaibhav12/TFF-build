'use client';
import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { computeProjectedTax, advanceTaxSchedule } from '@/lib/services/tax-projection-pure';
import { saveProjectionAction } from '@/lib/actions/projection';
import { formatCurrencyINR } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectionForm({ clientId, fyEndingYear, initial }: { clientId: string; fyEndingYear: number; initial?: any }) {
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    fy_ending_year: fyEndingYear,
    projected_gross_income: initial?.raw_value ?? 0,
    projected_deductions: 0,
    projected_tds_paid: initial?.benchmark_value ?? 0,
    notes: initial?.recommended_action ?? '',
  });
  const calc = useMemo(() => {
    const t = computeProjectedTax(f.projected_gross_income, f.projected_deductions);
    return { ...t, schedule: advanceTaxSchedule(t.tax), netDue: Math.max(0, t.tax - f.projected_tds_paid) };
  }, [f]);

  function save() {
    startTransition(async () => {
      const r = await saveProjectionAction({
        client_id: clientId,
        fy_ending_year: f.fy_ending_year,
        gross_income: f.projected_gross_income,
        tax: calc.tax,
        tds_paid: f.projected_tds_paid,
        notes: f.notes,
      });
      if (r.success) toast.success('Projection saved');
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold">Inputs</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Projected gross income (₹)</Label><Input type="number" value={f.projected_gross_income} onChange={(e) => setF({ ...f, projected_gross_income: Number(e.target.value) })} data-testid="proj-income" /></div>
          <div className="space-y-2"><Label>Projected deductions (₹)</Label><Input type="number" value={f.projected_deductions} onChange={(e) => setF({ ...f, projected_deductions: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>TDS already paid (₹)</Label><Input type="number" value={f.projected_tds_paid} onChange={(e) => setF({ ...f, projected_tds_paid: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>FY ending</Label><Input type="number" value={f.fy_ending_year} onChange={(e) => setF({ ...f, fy_ending_year: Number(e.target.value) })} /></div>
        </div>
        <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold">Projected liability</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Taxable income" value={formatCurrencyINR(calc.taxable_income)} />
          <Stat label="Tax (incl. cess 4%)" value={formatCurrencyINR(calc.tax)} />
          <Stat label="TDS paid" value={formatCurrencyINR(f.projected_tds_paid)} />
          <Stat label="Net advance tax due" value={formatCurrencyINR(calc.netDue)} highlight />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-base font-semibold mb-4">Advance tax schedule</h3>
        <div className="divide-y divide-zinc-100">
          {calc.schedule.map((s) => (
            <div key={s.instalment} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2"><Badge variant="outline">{s.percent}%</Badge><span>{s.instalment}</span></div>
              <div className="font-mono tabular-nums">{formatCurrencyINR(s.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={pending} data-testid="proj-save">{pending ? 'Saving…' : 'Save projection'}</Button>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'rounded-lg bg-teal-50 border border-teal-200 p-3' : 'rounded-lg bg-zinc-50 p-3'}>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 font-semibold tabular-nums ${highlight ? 'text-teal-800' : 'text-zinc-900'}`}>{value}</div>
    </div>
  );
}
