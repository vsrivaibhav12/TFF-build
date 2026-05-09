'use client';
import { useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toggleTaskStepAction, addAdHocTaskStepAction } from '@/lib/actions/task-steps';
import { toast } from 'sonner';
import { Plus, ListChecks } from 'lucide-react';
import { formatDateIST, cn } from '@/lib/utils';

interface Step {
  id: string;
  step_order: number;
  title: string;
  description?: string | null;
  is_required: boolean;
  completed_at: string | null;
  source_sop_step_id: string | null;
  users_profile?: { full_name: string } | null;
}

export default function TaskStepsPanel({ taskId, initial }: { taskId: string; initial: Step[] }) {
  const [steps, setSteps] = useState<Step[]>(initial);
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();

  const completed = steps.filter((s) => s.completed_at).length;
  const total = steps.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  function toggle(s: Step) {
    const next = !s.completed_at;
    // Optimistic
    setSteps((arr) => arr.map((x) => x.id === s.id ? { ...x, completed_at: next ? new Date().toISOString() : null } : x));
    startTransition(async () => {
      const r = await toggleTaskStepAction({ step_id: s.id, task_id: taskId, completed: next });
      if (!r.success) {
        // revert
        setSteps((arr) => arr.map((x) => x.id === s.id ? { ...x, completed_at: s.completed_at } : x));
        toast.error(r.error);
      }
    });
  }

  function addStep() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const r = await addAdHocTaskStepAction({ task_id: taskId, title: draft.trim() });
      if (r.success) {
        toast.success('Step added');
        setSteps((arr) => [
          ...arr,
          { id: (r as any).data.id, step_order: arr.length + 1, title: draft.trim(), is_required: false, completed_at: null, source_sop_step_id: null },
        ]);
        setDraft('');
      } else toast.error(r.error);
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4" data-testid="task-steps-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4 text-teal-600" /> Checklist</h3>
        <Badge variant={pct === 100 ? 'success' : 'outline'}>{completed} / {total} · {pct}%</Badge>
      </div>
      {total > 0 && (
        <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {steps.length === 0 ? (
        <p className="text-sm text-zinc-500">No checklist for this task. The SOP attached to the linked sub-service is empty, or the task wasn’t linked to one. Add ad-hoc steps below.</p>
      ) : (
        <ul className="space-y-2">{steps.map((s) => {
          const done = !!s.completed_at;
          return (
            <li key={s.id} className={cn('flex items-start gap-3 rounded-lg border border-zinc-200 p-3', done && 'bg-teal-50/30 border-teal-200')}>
              <Checkbox checked={done} onCheckedChange={() => toggle(s)} disabled={pending} data-testid={`step-${s.id}`} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', done && 'line-through text-zinc-500')}>{s.title}</div>
                {s.description && <div className="text-xs text-zinc-500 mt-0.5">{s.description}</div>}
                {done && (
                  <div className="text-[10px] text-zinc-400 mt-1">
                    {s.users_profile?.full_name ?? 'someone'} · {formatDateIST(s.completed_at!)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!s.source_sop_step_id && <Badge variant="outline" className="text-[9px]">ad-hoc</Badge>}
                {!s.is_required && <Badge variant="outline" className="text-[9px]">optional</Badge>}
              </div>
            </li>
          );
        })}</ul>
      )}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add ad-hoc step…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }} data-testid="task-step-input" />
        <Button onClick={addStep} disabled={pending || !draft.trim()} size="sm" data-testid="task-step-add"><Plus className="h-3 w-3" /> Add</Button>
      </div>
    </div>
  );
}
