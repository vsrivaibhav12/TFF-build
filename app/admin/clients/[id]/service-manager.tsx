'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { unlinkSubServiceAction, linkSubServiceAction } from '@/lib/actions/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Props {
  clientId: string;
  existingSubServices: any[];
  existingServices: any[];
}

export default function ClientServiceManager({ clientId, existingSubServices, existingServices }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pickedSubServiceId, setPickedSubServiceId] = useState('');
  const [allSubServices, setAllSubServices] = useState<any[]>([]);
  const [loadedAll, setLoadedAll] = useState(false);

  async function loadAll() {
    if (loadedAll) return;
    const res = await fetch('/api/sub-services', { cache: 'no-store' });
    const data = await res.json();
    setAllSubServices(data.items ?? []);
    setLoadedAll(true);
  }

  function unlink(linkId: string) {
    if (!confirm('Remove this sub-service from the client?')) return;
    startTransition(async () => {
      const r = await unlinkSubServiceAction({ id: linkId, client_id: clientId });
      if (!r.success) toast.error(r.error);
      else { toast.success('Removed'); router.refresh(); }
    });
  }

  function add() {
    if (!pickedSubServiceId) return;
    startTransition(async () => {
      const r = await linkSubServiceAction({ client_id: clientId, sub_service_id: pickedSubServiceId });
      if (!r.success) toast.error(r.error);
      else { toast.success('Added'); setOpen(false); setPickedSubServiceId(''); router.refresh(); }
    });
  }

  const linkedIds = new Set(existingSubServices.map((x: any) => x.sub_services?.id));
  const available = allSubServices.filter((s: any) => !linkedIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Subscribed sub-services</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) loadAll(); }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="add-sub-service-btn"><Plus className="h-4 w-4" /> Add sub-service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add sub-service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={pickedSubServiceId} onValueChange={setPickedSubServiceId}>
                <SelectTrigger data-testid="pick-sub-service"><SelectValue placeholder="Select sub-service…" /></SelectTrigger>
                <SelectContent>
                  {available.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.code} — {s.name} ({s.frequency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {available.length === 0 && <p className="text-xs text-zinc-500">All sub-services already linked.</p>}
            </div>
            <DialogFooter>
              <Button onClick={add} disabled={!pickedSubServiceId || pending} data-testid="add-sub-service-confirm">Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {existingSubServices.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500 bg-zinc-50">No sub-services yet. Add one to start auto-generating monthly tasks.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-200">
          {existingSubServices.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-zinc-900">{s.sub_services?.name}</div>
                <div className="text-xs text-zinc-500">{s.sub_services?.services?.name} · {s.sub_services?.frequency} · <span className="font-mono">{s.sub_services?.code}</span></div>
              </div>
              <div className="flex items-center gap-2">
                {s.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Paused</Badge>}
                <Button variant="ghost" size="sm" onClick={() => unlink(s.id)} disabled={pending}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
