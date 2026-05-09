'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { ok, fail, type ActionResult } from '@/lib/actions/result';
import { createTaskSchema, transitionTaskSchema, type CreateTaskInput, type TaskStatus } from '@/lib/validation/schemas';
import { transitionTaskStatus, addTaskNote } from '@/lib/services/task-service';
import { seedTaskStepsFromSop } from '@/lib/services/task-steps-service';
import { notify } from '@/lib/services/notification-service';

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team']);
    await requireCapability(me, 'tasks.assign');
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { data, error } = await sb.from('tasks').insert({ ...parsed.data, status: 'pending' }).select('id').single();
    if (error) return fail(error.message, 'DB');
    await sb.from('task_activity').insert({
      task_id: data.id,
      action: 'created',
      field_name: 'status',
      new_value: 'pending',
      changed_by: me.id,
    });
    // If linked to a sub-service, copy its SOP steps onto the new task
    if (parsed.data.sub_service_id) {
      try {
        await seedTaskStepsFromSop(sb as any, { task_id: data.id, sub_service_id: parsed.data.sub_service_id });
      } catch {
        // Non-fatal: task was created; SOP just didn't seed.
      }
    }
    revalidatePath('/team/tasks');
    revalidatePath('/portal/tasks');
    revalidatePath(`/team/clients/${parsed.data.client_id}`);
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function transitionTaskAction(input: { task_id: string; to_status: TaskStatus; note?: string }): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team', 'client']);
    const parsed = transitionTaskSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    await transitionTaskStatus({
      taskId: parsed.data.task_id,
      toStatus: parsed.data.to_status,
      performedBy: me.id,
      note: parsed.data.note,
    });
    revalidatePath('/team/tasks');
    revalidatePath(`/team/tasks/${parsed.data.task_id}`);
    revalidatePath('/portal/tasks');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function addTaskNoteAction(input: { task_id: string; body: string }): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team', 'client']);
    if (!input.body || input.body.trim().length < 1) return fail('Note cannot be empty', 'VALIDATION');
    await addTaskNote(input.task_id, input.body.trim(), me.id);
    revalidatePath(`/team/tasks/${input.task_id}`);
    revalidatePath(`/portal/tasks/${input.task_id}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function assignTaskAction(input: { task_id: string; assigned_to?: string | null; reviewer_id?: string | null }): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team']);
    await requireCapability(me, 'tasks.assign');
    const sb = createClient();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.assigned_to !== undefined) updates.assigned_to = input.assigned_to || null;
    if (input.reviewer_id !== undefined) updates.reviewer_id = input.reviewer_id || null;
    const { error } = await sb.from('tasks').update(updates).eq('id', input.task_id);
    if (error) return fail(error.message, 'DB');
    await sb.from('task_activity').insert({
      task_id: input.task_id,
      action: 'assignment_changed',
      field_name: 'assignment',
      new_value: `assigned_to=${input.assigned_to ?? '-'} reviewer=${input.reviewer_id ?? '-'}`,
      changed_by: me.id,
    });
    revalidatePath(`/team/tasks/${input.task_id}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

/**
 * Send a reminder to all client portal users linked to the task's client.
 * Allowed only when task is in 'awaiting_client'. Writes an in-app notification
 * (and an email if the user has 'immediate' preference), plus a task_activity row.
 * Throttled to one reminder per 6 hours per task to avoid spam.
 */
export async function sendTaskReminderAction(input: { task_id: string; message?: string }): Promise<ActionResult<{ recipients: number }>> {
  try {
    const me = await requireRole(['admin', 'team']);
    if (!input.task_id) return fail('task_id is required', 'VALIDATION');
    const sb = createClient();
    const { data: task, error: tErr } = await sb
      .from('tasks')
      .select('id, title, status, client_id, due_date, clients(business_name)')
      .eq('id', input.task_id)
      .maybeSingle();
    if (tErr) return fail(tErr.message, 'DB');
    if (!task) return fail('Task not found', 'NOT_FOUND');
    if ((task as any).status !== 'awaiting_client') {
      return fail('Reminders can only be sent for tasks awaiting the client', 'INVALID_STATE');
    }

    // Throttle: refuse if a reminder activity exists within the last 6h
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await sb
      .from('task_activity')
      .select('id, created_at')
      .eq('task_id', input.task_id)
      .eq('action', 'reminder_sent')
      .gte('created_at', sixHoursAgo)
      .limit(1);
    if (recent && recent.length > 0) {
      return fail('A reminder was already sent in the last 6 hours', 'THROTTLED');
    }

    // Find client portal users for this client
    const { data: clientUsers } = await sb
      .from('client_users')
      .select('user_id')
      .eq('client_id', (task as any).client_id)
      .eq('is_active', true);

    const userIds = (clientUsers ?? []).map((u: any) => u.user_id).filter(Boolean);
    const subject = `Reminder: ${(task as any).title}`;
    const body = input.message?.trim()
      || `We're waiting on inputs for "${(task as any).title}". Please respond at your earliest convenience.`;

    for (const uid of userIds) {
      await notify({
        user_id: uid,
        type: 'task_due_soon',
        title: subject,
        message: body,
        related_entity_type: 'task',
        related_entity_id: input.task_id,
        immediate: true,
      });
    }

    // Audit / activity entry
    await sb.from('task_activity').insert({
      task_id: input.task_id,
      action: 'reminder_sent',
      field_name: 'reminder',
      new_value: `${userIds.length} recipient${userIds.length === 1 ? '' : 's'}`,
      changed_by: me.id,
    });

    revalidatePath(`/team/tasks/${input.task_id}`);
    revalidatePath('/team/tasks');
    return ok({ recipients: userIds.length });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

