import 'server-only';
import { ServiceError } from '@/lib/actions/result';
import type { TaskStatus } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['awaiting_client', 'in_progress'],
  awaiting_client: ['in_progress'],
  in_progress: ['review', 'awaiting_client'],
  review: ['completed', 'in_progress'],
  completed: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: TaskStatus): TaskStatus[] {
  return TRANSITIONS[from] ?? [];
}

export interface TransitionInput {
  taskId: string;
  toStatus: TaskStatus;
  performedBy: string;
  note?: string;
}

export async function transitionTaskStatus(input: TransitionInput) {
  const sb = createClient();
  const { data: task, error } = await sb
    .from('tasks')
    .select('id, status, reviewer_id, assigned_to, started_date')
    .eq('id', input.taskId)
    .maybeSingle();
  if (error) throw error;
  if (!task) throw new ServiceError('Task not found', 'NOT_FOUND');
  if (!canTransition(task.status as TaskStatus, input.toStatus)) {
    throw new ServiceError(`Cannot transition ${task.status} → ${input.toStatus}`, 'INVALID_TRANSITION');
  }
  if (input.toStatus === 'review' && !task.assigned_to) {
    throw new ServiceError('Cannot send to review: no assignee', 'NO_ASSIGNEE');
  }
  if (input.toStatus === 'completed' && !task.reviewer_id) {
    throw new ServiceError('Cannot complete: reviewer must be set first', 'NO_REVIEWER');
  }

  const today = new Date().toISOString().slice(0, 10);
  const updates: Record<string, any> = { status: input.toStatus, updated_at: new Date().toISOString() };
  if (input.toStatus === 'in_progress' && !task.started_date) updates.started_date = today;
  if (input.toStatus === 'completed') updates.completed_date = today;

  const { error: upErr } = await sb.from('tasks').update(updates).eq('id', input.taskId);
  if (upErr) throw upErr;

  await sb.from('task_activity').insert({
    task_id: input.taskId,
    action: 'status_changed',
    field_name: 'status',
    old_value: task.status,
    new_value: input.toStatus,
    changed_by: input.performedBy,
  });

  if (input.note && input.note.trim()) {
    await sb.from('task_notes').insert({
      task_id: input.taskId,
      note_text: input.note.trim(),
      created_by: input.performedBy,
    });
  }
}

export async function addTaskNote(taskId: string, body: string, performedBy: string) {
  const sb = createClient();
  const { error } = await sb.from('task_notes').insert({
    task_id: taskId,
    note_text: body,
    created_by: performedBy,
  });
  if (error) throw error;
  await sb.from('task_activity').insert({
    task_id: taskId,
    action: 'note_added',
    field_name: 'note',
    new_value: body.slice(0, 200),
    changed_by: performedBy,
  });
}
