'use client';
import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addSolutionAction } from '@/lib/actions/vcfo';
import { toast } from 'sonner';

export default function SolutionForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    issue_identified_date: new Date().toISOString().slice(0, 10),
    issue_description: '',
    issue_category: 'cash_flow' as const,
    recommended_solution: '',
    financial_impact_estimate: undefined as number | undefined,
    root_cause: '',
  });
  function save() {
    if (!f.issue_description || !f.recommended_solution) { toast.error('Issue and recommendation required'); return; }
    startTransition(async () => {
      const r = await addSolutionAction({ client_id: clientId, ...f } as any);
      if (r.success) { toast.success('Solution logged'); setOpen(false); } else toast.error(r.error);
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" size="sm" data-testid="solution-new">Add observation</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Solution log entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={f.issue_identified_date} onChange={(e) => setF({ ...f, issue_identified_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={f.issue_category} onValueChange={(v) => setF({ ...f, issue_category: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['cash_flow', 'profitability', 'tax_optimization', 'working_capital', 'vendor_management', 'process', 'compliance', 'other'].map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Issue *</Label><Textarea rows={2} value={f.issue_description} onChange={(e) => setF({ ...f, issue_description: e.target.value })} /></div>
          <div className="space-y-2"><Label>Root cause</Label><Textarea rows={2} value={f.root_cause} onChange={(e) => setF({ ...f, root_cause: e.target.value })} /></div>
          <div className="space-y-2"><Label>Recommended solution *</Label><Textarea rows={3} value={f.recommended_solution} onChange={(e) => setF({ ...f, recommended_solution: e.target.value })} /></div>
          <div className="space-y-2"><Label>Estimated financial impact (₹)</Label><Input type="number" value={f.financial_impact_estimate ?? ''} onChange={(e) => setF({ ...f, financial_impact_estimate: e.target.value ? Number(e.target.value) : undefined })} /></div>
        </div>
        <DialogFooter><Button onClick={save} disabled={pending} data-testid="solution-save">{pending ? 'Saving…' : 'Save'}</Button></DialogFooter>
      </DialogContent></Dialog>
  );
}
