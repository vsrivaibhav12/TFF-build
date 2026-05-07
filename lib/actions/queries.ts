'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { ok, fail, type ActionResult } from '@/lib/actions/result';
import { createQuerySchema, replyQuerySchema, type CreateQueryInput } from '@/lib/validation/schemas';

export async function createQueryAction(input: CreateQueryInput): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin', 'team', 'client']);
    const parsed = createQuerySchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { data, error } = await sb
      .from('queries')
      .insert({
        client_id: parsed.data.client_id,
        task_id: parsed.data.task_id ?? null,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: 'open',
        created_by: me.id,
      })
      .select('id')
      .single();
    if (error) return fail(error.message, 'DB');
    // Seed first message
    await sb.from('query_messages').insert({
      query_id: data.id,
      message_text: parsed.data.description,
      sender_id: me.id,
    });
    revalidatePath('/portal/queries');
    revalidatePath('/team/queries');
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function replyQueryAction(input: { query_id: string; message: string }): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team', 'client']);
    const parsed = replyQuerySchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { error } = await sb.from('query_messages').insert({
      query_id: parsed.data.query_id,
      message_text: parsed.data.message,
      sender_id: me.id,
    });
    if (error) return fail(error.message, 'DB');
    // Bump query.updated_at + flip status if needed
    await sb
      .from('queries')
      .update({ updated_at: new Date().toISOString(), status: me.role === 'client' ? 'in_progress' : 'in_progress' })
      .eq('id', parsed.data.query_id);
    revalidatePath(`/portal/queries/${parsed.data.query_id}`);
    revalidatePath(`/team/queries/${parsed.data.query_id}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function closeQueryAction(input: { query_id: string; resolution_notes?: string }): Promise<ActionResult<void>> {
  try {
    await requireRole(['admin', 'team']);
    const sb = createClient();
    const { error } = await sb
      .from('queries')
      .update({
        status: 'resolved',
        resolution_notes: input.resolution_notes ?? null,
        resolved_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.query_id);
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/team/queries/${input.query_id}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
