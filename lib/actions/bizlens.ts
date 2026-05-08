'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { ok, fail, type ActionResult } from '@/lib/actions/result';

const saveSchema = z.object({
  client_id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  state_json: z.any(),
});
export async function saveBizlensStateAction(input: z.infer<typeof saveSchema>): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team']);
    await requireCapability(me, 'bizlens.enter');
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    const { error } = await sb.from('bizlens_data').upsert(
      {
        client_id: parsed.data.client_id,
        month: parsed.data.month,
        year: parsed.data.year,
        state_json: parsed.data.state_json,
        updated_by: me.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,month,year' },
    );
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/team/clients/${parsed.data.client_id}/bizlens`);
    revalidatePath('/portal/bizlens');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
