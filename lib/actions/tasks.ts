'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { ok, fail, type ActionResult } from '@/lib/actions/result';
import { createTaskSchema, transitionTaskSchema, type CreateTaskInput, type TaskStatus } from '@/lib/validation/schemas';
import { transitionTaskStatus, addTaskNote } from '@/lib/services/task-service';

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team']);
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
