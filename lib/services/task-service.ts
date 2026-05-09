import 'server-only';
import { ServiceError } from '@/lib/actions/result';
import type { TaskStatus } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import { canTransition } from '@/lib/services/task-transitions';

export { canTransition, nextStatuses } from '@/lib/services/task-transitions';

export interface TransitionInput {
  taskId: string;
  toStatus: TaskStatus;
  performedBy: string;
  note?: string;
}

/**
 * v3 status transition.
 * Rules:
 *  - to='in_progress' from pending: no further checks beyond canTransition.
 *  - to='completed': all required task_steps must be signed off; if the
 *    sub-service has requires_verification = true, this auto-sets
 *    verification_status='pending'. The completion itself is otherwise allowed
 *    so the portal sees "Filed / Done"; verification is internal-only.
 *  - to='cancelled': always allowed from any non-completed state.
 */
export async function transitionTaskStatus(input: TransitionInput) {
  const sb = createClient();
  const { data: task, error } = await sb
    .from('tasks')
    .select('id, status, sub_service_id, started_date')
    .eq('id', input.taskId)
    .maybeSingle();
  if (error) throw error;
  if (!task) throw new ServiceError('Task not found', 'NOT_FOUND');
  if (!canTransition(task.status as TaskStatus, input.toStatus)) {
    throw new ServiceError(
      `Cannot transition ${task.status} → ${input.toStatus}`,
      'INVALID_TRANSITION',
    );
  }

  // Sign-off gate when completing.
  if (input.toStatus === 'completed') {
    const { data: stepRows, error: stepErr } = await sb
      .from('task_steps')
      .select('id, is_required, completed_at')
      .eq('task_id', input.taskId);
    if (stepErr) throw stepErr;
    const required = (stepRows ?? []).filter((r: any) => r.is_required);
    const incomplete = required.filter((r: any) => !r.completed_at).length;
    if (required.length > 0 && incomplete > 0) {
      throw new ServiceError(
        `Cannot complete: ${incomplete} required checklist step${incomplete > 1 ? 's' : ''} still pending sign-off`,
        'STEPS_INCOMPLETE',
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const updates: Record<string, any> = {
    status: input.toStatus,
    updated_at: new Date().toISOString(),
  };
  if (input.toStatus === 'in_progress' && !task.started_date) updates.started_date = today;
  if (input.toStatus === 'completed') updates.completed_date = today;

  // If sub-service requires verification, auto-set verification_status = 'pending'.
  if (input.toStatus === 'completed' && task.sub_service_id) {
    const { data: ss } = await sb
      .from('sub_services')
      .select('requires_verification')
      .eq('id', task.sub_service_id)
      .maybeSingle();
    if ((ss as any)?.requires_verification) {
      updates.verification_status = 'pending';
    }
  }

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

/**
 * Toggle the "blocked on client" flag. When turning ON, the task auto-transitions
 * UI to "Awaiting your data". When turning OFF (e.g. all document_requests met),
 * the task is unblocked but its status doesn't change.
 */
export async function setTaskBlockedOnClient(
  taskId: string,
  blocked: boolean,
  performedBy: string,
) {
  const sb = createClient();
  const { error } = await sb
    .from('tasks')
    .update({ is_blocked_on_client: blocked, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
  await sb.from('task_activity').insert({
    task_id: taskId,
    action: blocked ? 'blocked_on_client' : 'unblocked_from_client',
    field_name: 'is_blocked_on_client',
    new_value: blocked ? 'true' : 'false',
    changed_by: performedBy,
  });
}

/**
 * Toggle stuck flag with optional reason taxonomy + free-text note.
 */
export async function setTaskStuck(
  taskId: string,
  stuck: boolean,
  performedBy: string,
  reason?: string | null,
  note?: string | null,
) {
  const sb = createClient();
  const updates: Record<string, any> = {
    is_stuck: stuck,
    stuck_reason_code: stuck ? (reason ?? null) : null,
    stuck_reason_note: stuck ? (note ?? null) : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from('tasks').update(updates).eq('id', taskId);
  if (error) throw error;
  await sb.from('task_activity').insert({
    task_id: taskId,
    action: stuck ? 'task_stuck' : 'task_unstuck',
    field_name: 'is_stuck',
    new_value: stuck ? `${reason ?? 'other'}: ${note ?? ''}`.slice(0, 200) : 'false',
    changed_by: performedBy,
  });
}

/**
 * Mark a completed task as verified by a reviewer.
 */
export async function verifyTask(taskId: string, performedBy: string, note?: string | null) {
  const sb = createClient();
  const { data: task } = await sb
    .from('tasks')
    .select('status, verification_status')
    .eq('id', taskId)
    .maybeSingle();
  if (!task) throw new ServiceError('Task not found', 'NOT_FOUND');
  if ((task as any).status !== 'completed') {
    throw new ServiceError('Cannot verify: task is not completed yet', 'NOT_COMPLETED');
  }
  if ((task as any).verification_status === 'verified') {
    throw new ServiceError('Already verified', 'ALREADY_VERIFIED');
  }
  const { error } = await sb
    .from('tasks')
    .update({
      verification_status: 'verified',
      verified_by_user_id: performedBy,
      verified_at: new Date().toISOString(),
      verification_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
  if (error) throw error;
  await sb.from('task_activity').insert({
    task_id: taskId,
    action: 'task_verified',
    field_name: 'verification_status',
    new_value: 'verified',
    changed_by: performedBy,
  });
}
