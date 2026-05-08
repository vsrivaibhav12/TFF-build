'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { ok, fail, type ActionResult } from '@/lib/actions/result';

const snapshotSchema = z.object({
  client_id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  cash_in_bank: z.number().optional(),
  monthly_burn: z.number().optional(),
  revenue: z.number().optional(),
  budgeted_revenue: z.number().optional(),
  budgeted_expenses: z.number().optional(),
  actual_revenue: z.number().optional(),
  actual_expenses: z.number().optional(),
  advisor_notes: z.string().optional(),
});
export async function upsertVcfoSnapshotAction(input: z.infer<typeof snapshotSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team']);
    await requireCapability(me, 'vcfo.enter');
    const parsed = snapshotSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { data, error } = await sb
      .from('vcfo_snapshots')
      .upsert({ ...parsed.data, data_entered_by: me.id, updated_at: new Date().toISOString() }, { onConflict: 'client_id,month,year' })
      .select('id')
      .single();
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/team/clients/${parsed.data.client_id}/vcfo`);
    revalidatePath('/portal/vcfo');
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

const solutionSchema = z.object({
  client_id: z.string().uuid(),
  issue_identified_date: z.string(),
  issue_description: z.string().min(1),
  issue_category: z.enum(['cash_flow', 'profitability', 'tax_optimization', 'working_capital', 'vendor_management', 'process', 'compliance', 'other']),
  recommended_solution: z.string().min(1),
  financial_impact_estimate: z.number().optional(),
  root_cause: z.string().optional(),
});
export async function addSolutionAction(input: z.infer<typeof solutionSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team']);
    await requireCapability(me, 'vcfo.enter');
    const parsed = solutionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { data, error } = await sb
      .from('solution_log')
      .insert({ ...parsed.data, identified_by: me.id, solution_status: 'recommended' })
      .select('id')
      .single();
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/team/clients/${parsed.data.client_id}/vcfo`);
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
