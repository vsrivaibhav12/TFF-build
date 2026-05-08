'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { computePayroll, type PayrollSettings, type PayrollFacts, type PayrollAdjustment } from '@/lib/services/payroll-service';
import { ok, fail, type ActionResult } from '@/lib/actions/result';

export async function runPayrollAction(input: { user_id: string; year: number; month: number; adjustments?: PayrollAdjustment[] }): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'payroll.run');
    const sb = createClient();

    // Settings
    const { data: s } = await sb
      .from('staff_payroll_settings')
      .select('monthly_salary, paid_leaves_per_month, deduction_applicable, salary_adjustment_for_leaves')
      .eq('user_id', input.user_id)
      .maybeSingle();
    if (!s) return fail('No payroll settings for user', 'NO_SETTINGS');
    const settings: PayrollSettings = s as any;

    // Working days = total weekdays in the month (Mon-Fri). Holidays are not modelled here.
    const monthStart = new Date(input.year, input.month - 1, 1);
    const monthEnd = new Date(input.year, input.month, 0);
    let totalWorkingDays = 0;
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) totalWorkingDays++;
    }

    // Facts from attendance_logs
    const { data: logs } = await sb
      .from('attendance_logs')
      .select('status')
      .eq('user_id', input.user_id)
      .gte('attendance_date', monthStart.toISOString().slice(0, 10))
      .lte('attendance_date', monthEnd.toISOString().slice(0, 10));
    let present = 0, leave = 0;
    for (const l of logs ?? []) {
      if ((l as any).status === 'present' || (l as any).status === 'work_from_home') present++;
      else if ((l as any).status === 'leave') leave++;
    }
    const facts: PayrollFacts = { total_working_days: totalWorkingDays, actual_present_days: present, actual_leave_days: leave };

    const result = computePayroll(settings, facts, input.adjustments ?? []);

    const { data: row, error } = await sb
      .from('payroll_runs')
      .upsert({
        user_id: input.user_id,
        month: input.month,
        year: input.year,
        total_working_days: facts.total_working_days,
        actual_present_days: facts.actual_present_days,
        actual_leave_days: facts.actual_leave_days,
        paid_leave_days: result.paid_leave_days,
        unpaid_leave_days: result.unpaid_leave_days,
        daily_rate: result.daily_rate,
        base_salary: result.base_salary,
        salary_for_present_days: result.salary_for_present_days,
        deduction_for_excess_leaves: result.deduction_for_excess_leaves,
        total_deductions: result.total_deductions,
        gross_salary: result.gross_salary,
        final_salary: result.final_salary,
        status: 'draft',
        created_by: me.id,
      }, { onConflict: 'user_id,month,year' })
      .select('id')
      .single();
    if (error) return fail(error.message, 'DB');

    revalidatePath('/admin/payroll');
    return ok({ id: row.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
