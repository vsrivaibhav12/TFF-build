import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Copy every active SOP step from `sub_service_sop_steps` into `task_steps`
 * for the given task. Caller passes the supabase client (server or service-role)
 * so this works from both Server Actions (RLS-scoped) and crons (bypass).
 *
 * Returns the number of step rows inserted. Idempotent guarded by check on
 * existing task_steps for that task id.
 */
export async function seedTaskStepsFromSop(
  sb: SupabaseClient,
  args: { task_id: string; sub_service_id: string },
): Promise<number> {
  // Skip if already seeded
  const { data: existing } = await sb
    .from('task_steps')
    .select('id', { head: true, count: 'exact' })
    .eq('task_id', args.task_id)
    .limit(1);
  if (existing && (existing as any).length > 0) return 0;

  // Pull SOP
  const { data: sop } = await sb
    .from('sub_service_sop_steps')
    .select('id, step_order, title, description, is_required')
    .eq('sub_service_id', args.sub_service_id)
    .eq('is_deleted', false)
    .order('step_order', { ascending: true });

  if (!sop || sop.length === 0) return 0;

  const rows = sop.map((s: any) => ({
    task_id: args.task_id,
    step_order: s.step_order,
    title: s.title,
    description: s.description ?? null,
    is_required: s.is_required ?? true,
    source_sop_step_id: s.id,
  }));
  const { error } = await sb.from('task_steps').insert(rows);
  if (error) throw error;
  return rows.length;
}
