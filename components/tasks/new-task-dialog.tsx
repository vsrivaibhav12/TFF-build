'use client';
import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createTaskAction } from '@/lib/actions/tasks';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface Props {
  clients: { id: string; business_name: string }[];
  team: { id: string; full_name: string }[];
  defaultClientId?: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline';
}

export default function NewTaskDialog({ clients, team, defaultClientId, triggerLabel = 'New task', triggerVariant = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [clientSubServices, setClientSubServices] = useState<any[]>([]);
  const [f, setF] = useState({
    client_id: defaultClientId ?? '',
    sub_service_id: '',
    title: '',
    description: '',
    priority: 'medium' as const,
    assigned_to: '',
    due_date: '',
  });

  function set<K extends keyof typeof f>(k: K, v: any) { setF((p) => ({ ...p, [k]: v })); }

  // Load this client's services when client changes
  useEffect(() => {
    if (!f.client_id) { setClientSubServices([]); return; }
    fetch(`/api/clients/${f.client_id}/sub-services`).then((r) => r.json()).then((j) => setClientSubServices(j.items ?? [])).catch(() => setClientSubServices([]));
  }, [f.client_id]);

  function save() {
    if (!f.client_id) { toast.error('Pick a client'); return; }
    if (!f.title.trim()) { toast.error('Title is required'); return; }
    startTransition(async () => {
      const payload: any = {
        client_id: f.client_id,
        title: f.title.trim(),
        description: f.description || undefined,
        priority: f.priority,
        assigned_to: f.assigned_to || undefined,
        due_date: f.due_date || undefined,
        sub_service_id: f.sub_service_id || undefined,
      };
      const r = await createTaskAction(payload);
      if (r.success) {
        toast.success('Task created');
        setOpen(false);
        setF({ ...f, title: '', description: '', sub_service_id: '', due_date: '' });
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} data-testid="new-task-button"><Plus className="h-4 w-4" /> {triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!defaultClientId && (
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={f.client_id} onValueChange={(v) => set('client_id', v)}>
                <SelectTrigger data-testid="task-client"><SelectValue placeholder="Choose a client…" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {f.client_id && clientSubServices.length > 0 && (
            <div className="space-y-2">
              <Label>Linked service (optional)</Label>
              <Select value={f.sub_service_id} onValueChange={(v) => set('sub_service_id', v)}>
                <SelectTrigger><SelectValue placeholder="Standalone task" /></SelectTrigger>
                <SelectContent>
                  {clientSubServices.map((cs: any) => (
                    <SelectItem key={cs.sub_service_id} value={cs.sub_service_id}>
                      {cs.sub_services?.services?.name} → {cs.sub_services?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Prepare GSTR-3B for Sept" data-testid="task-title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={f.priority} onValueChange={(v) => set('priority', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">low</SelectItem>
                  <SelectItem value="medium">medium</SelectItem>
                  <SelectItem value="high">high</SelectItem>
                  <SelectItem value="urgent">urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={f.assigned_to} onValueChange={(v) => set('assigned_to', v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Due date</Label><Input type="date" value={f.due_date} onChange={(e) => set('due_date', e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save} disabled={pending} data-testid="task-save">{pending ? 'Creating…' : 'Create task'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
