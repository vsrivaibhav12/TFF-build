'use client';
import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { upsertVcfoSnapshotAction } from '@/lib/actions/vcfo';
import { toast } from 'sonner';

export default function VcfoForm({ clientId, latest }: { clientId: string; latest?: any }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const now = new Date();
  const [f, setF] = useState({
    month: latest?.month ?? now.getMonth() + 1,
    year: latest?.year ?? now.getFullYear(),
    cash_in_bank: latest?.cash_in_bank ?? 0,
    monthly_burn: latest?.monthly_burn ?? 0,
    revenue: latest?.revenue ?? 0,
    budgeted_revenue: latest?.budgeted_revenue ?? 0,
    budgeted_expenses: latest?.budgeted_expenses ?? 0,
    actual_revenue: latest?.actual_revenue ?? 0,
    actual_expenses: latest?.actual_expenses ?? 0,
    advisor_notes: latest?.advisor_notes ?? '',
  });
  function save() {
    startTransition(async () => {
      const r = await upsertVcfoSnapshotAction({ client_id: clientId, ...f } as any);
      if (r.success) { toast.success('Snapshot saved'); setOpen(false); } else toast.error(r.error);
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button data-testid="vcfo-new">{latest ? 'Update snapshot' : 'New snapshot'}</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>vCFO snapshot</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Month</Label><Input type="number" min={1} max={12} value={f.month} onChange={(e) => setF({ ...f, month: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Year</Label><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Cash in bank</Label><Input type="number" value={f.cash_in_bank} onChange={(e) => setF({ ...f, cash_in_bank: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Monthly burn</Label><Input type="number" value={f.monthly_burn} onChange={(e) => setF({ ...f, monthly_burn: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Revenue</Label><Input type="number" value={f.revenue} onChange={(e) => setF({ ...f, revenue: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Budgeted revenue</Label><Input type="number" value={f.budgeted_revenue} onChange={(e) => setF({ ...f, budgeted_revenue: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Budgeted expenses</Label><Input type="number" value={f.budgeted_expenses} onChange={(e) => setF({ ...f, budgeted_expenses: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Actual revenue</Label><Input type="number" value={f.actual_revenue} onChange={(e) => setF({ ...f, actual_revenue: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Actual expenses</Label><Input type="number" value={f.actual_expenses} onChange={(e) => setF({ ...f, actual_expenses: Number(e.target.value) })} /></div>
          <div className="col-span-2 space-y-2"><Label>Advisor notes</Label><Textarea rows={3} value={f.advisor_notes} onChange={(e) => setF({ ...f, advisor_notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save} disabled={pending} data-testid="vcfo-save">{pending ? 'Saving…' : 'Save'}</Button></DialogFooter>
      </DialogContent></Dialog>
  );
}
