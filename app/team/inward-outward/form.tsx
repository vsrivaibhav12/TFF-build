'use client';
import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { recordInwardOutwardAction } from '@/lib/actions/documents';
import { toast } from 'sonner';

export default function InwardOutwardForm({ clients, children }: { clients: any[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({ client_id: '', direction: 'inward' as 'inward' | 'outward', description: '', received_from_name: '', handed_to_name: '', date_received: '', expected_return_date: '', notes: '' });
  function save() {
    startTransition(async () => {
      const r = await recordInwardOutwardAction(f as any);
      if (r.success) { toast.success('Recorded'); setOpen(false); } else toast.error(r.error);
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New register entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Direction</Label>
              <Select value={f.direction} onValueChange={(v) => setF({ ...f, direction: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inward">inward</SelectItem><SelectItem value="outward">outward</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Client *</Label>
              <Select value={f.client_id} onValueChange={(v) => setF({ ...f, client_id: v })}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Description *</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>{f.direction === 'inward' ? 'From' : 'To'}</Label><Input value={f.direction === 'inward' ? f.received_from_name : f.handed_to_name} onChange={(e) => setF({ ...f, [f.direction === 'inward' ? 'received_from_name' : 'handed_to_name']: e.target.value } as any)} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={f.date_received} onChange={(e) => setF({ ...f, date_received: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Expected return</Label><Input type="date" value={f.expected_return_date} onChange={(e) => setF({ ...f, expected_return_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save} disabled={pending} data-testid="io-save">{pending ? 'Saving…' : 'Save'}</Button></DialogFooter>
      </DialogContent></Dialog>
  );
}
