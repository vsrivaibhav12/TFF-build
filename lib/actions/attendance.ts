'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { ok, fail, type ActionResult } from '@/lib/actions/result';

export async function checkInAction(): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team']);
    const sb = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    await sb.from('attendance_logs').upsert({
      user_id: me.id,
      attendance_date: today,
      check_in_time: now,
      status: 'present',
    }, { onConflict: 'user_id,attendance_date' });
    revalidatePath('/team/attendance');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function checkOutAction(): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin', 'team']);
    const sb = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data: existing } = await sb.from('attendance_logs').select('id').eq('user_id', me.id).eq('attendance_date', today).maybeSingle();
    if (!existing) return fail('No check-in for today', 'NO_CHECKIN');
    const { error } = await sb.from('attendance_logs').update({ check_out_time: now }).eq('id', (existing as any).id);
    if (error) return fail(error.message, 'DB');
    revalidatePath('/team/attendance');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

const overrideSchema = z.object({
  user_id: z.string().uuid(),
  attendance_date: z.string(),
  status: z.enum(['present', 'absent', 'leave', 'work_from_home']),
  leave_type: z.enum(['paid', 'unpaid', 'sick', 'casual', 'comp']).optional(),
  override_reason: z.string().min(1),
});
export async function overrideAttendanceAction(input: z.infer<typeof overrideSchema>): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'attendance.approve');
    const parsed = overrideSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const sb = createClient();
    await sb.from('attendance_logs').upsert({
      user_id: parsed.data.user_id,
      attendance_date: parsed.data.attendance_date,
      status: parsed.data.status,
      leave_type: parsed.data.leave_type,
      is_manually_created: true,
      override_reason: parsed.data.override_reason,
      overridden_by: me.id,
    }, { onConflict: 'user_id,attendance_date' });
    revalidatePath('/team/attendance');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
