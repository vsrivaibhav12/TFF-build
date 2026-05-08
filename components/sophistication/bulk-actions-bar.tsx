'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { transitionTaskAction } from '@/lib/actions/tasks';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

/**
 * Bulk actions bar surfaces when 1+ task rows are checked. Statuses are limited
 * to safe transitions; bulk-archive is a no-op until soft-delete is added.
 */
export default function BulkActionsBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const [status, setStatus] = useState<string>('');
  const [pending, startTransition] = useTransition();
  if (ids.length === 0) return null;
  function applyStatus() {
    if (!status) return;
    startTransition(async () => {
      let ok = 0, fail = 0;
      for (const id of ids) {
        const r = await transitionTaskAction({ task_id: id, to_status: status as any });
        if (r.success) ok++; else fail++;
      }
      toast[fail === 0 ? 'success' : 'warning'](`Updated ${ok} · failed ${fail}`);
      onClear();
    });
  }
  return (
    <div className="sticky bottom-4 z-30 mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-xl p-3 flex items-center gap-3" data-testid="bulk-bar">
      <span className="text-sm font-medium">{ids.length} selected</span>
      <div className="flex-1" />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Set status…" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="awaiting_client">Awaiting client</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={applyStatus} disabled={pending || !status} data-testid="bulk-apply">{pending ? 'Updating…' : 'Apply'}</Button>
      <Button onClick={onClear} variant="outline" size="icon" aria-label="Clear selection"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}
