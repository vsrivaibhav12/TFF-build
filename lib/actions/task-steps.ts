'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { ok, fail, type ActionResult } from '@/lib/actions/result';

const toggleSchema = z.object({
  step_id: z.string().uuid(),
  task_id: z.string().uuid(),
  completed: z.boolean(),
  completion_note: z.string().optional(),
});

export async function toggleTaskStepAction(input: z.infer<typeof toggleSchema>): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team']);
    const parsed = toggleSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const update = parsed.data.completed
      ? {
          completed_at: new Date().toISOString(),
          completed_by: me.id,
          completion_note: parsed.data.completion_note ?? null,
        }
      : {
          completed_at: null,
          completed_by: null,
          completion_note: null,
        };
    const { error } = await sb.from('task_steps').update(update).eq('id', parsed.data.step_id);
    if (error) return fail(error.message, 'DB');

    // Activity entry so it shows in audit / activity timeline
    await sb.from('task_activity').insert({
      task_id: parsed.data.task_id,
      action: parsed.data.completed ? 'step_completed' : 'step_reopened',
      field_name: 'step',
      new_value: parsed.data.step_id,
      changed_by: me.id,
    });
    revalidatePath(`/team/tasks/${parsed.data.task_id}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

const addSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string().min(1).max(200),
});
export async function addAdHocTaskStepAction(input: z.infer<typeof addSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team']);
    const parsed = addSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    // Compute next order
    const { data: existing } = await sb.from('task_steps').select('step_order').eq('task_id', parsed.data.task_id).order('step_order', { ascending: false }).limit(1).maybeSingle();
    const next_order = ((existing as any)?.step_order ?? 0) + 1;
    const { data, error } = await sb.from('task_steps').insert({
      task_id: parsed.data.task_id,
      step_order: next_order,
      title: parsed.data.title,
      is_required: false,
      source_sop_step_id: null,
    }).select('id').single();
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/team/tasks/${parsed.data.task_id}`);
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
