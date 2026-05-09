import { type NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-role';
import { seedTaskStepsFromSop } from '@/lib/services/task-steps-service';

/**
 * Vercel Cron: Generate monthly tasks from sub_services with frequency='monthly'.
 * For each (client, sub_service) pair where the client has the sub_service
 * enabled and a task does not yet exist for the current period, create one.
 *
 * Idempotent (partial unique index uniq_active_task_per_period prevents dupes).
 * Auth: Vercel cron sends `x-vercel-cron: 1` header. We also accept a shared
 * secret query param `?secret=<CRON_SECRET>` for manual triggers.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const isCron = request.headers.get('x-vercel-cron');
  const secret = request.nextUrl.searchParams.get('secret');
  if (!isCron && secret !== process.env.CRON_SECRET) return unauthorized();

  const sb = createServiceClient();
  const today = new Date();
  const periodMonth = today.getMonth() + 1;
  const periodYear = today.getFullYear();

  // Pull all active client_sub_services where sub_service is monthly + recurring
  const { data: links, error } = await sb
    .from('client_sub_services')
    .select('client_id, sub_service_id, sub_services(id, code, name, frequency, due_day_of_month, is_recurring)')
    .eq('is_active', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const l of links ?? []) {
    const ss: any = l.sub_services;
    if (!ss || ss.frequency !== 'monthly' || !ss.is_recurring) {
      skipped++;
      continue;
    }
    // Compute due date for this month
    const dom = Math.min(28, ss.due_day_of_month ?? 28);
    const dueDate = new Date(periodYear, periodMonth - 1, dom);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    // Check for existing
    const { data: ex } = await sb
      .from('tasks')
      .select('id')
      .eq('client_id', l.client_id)
      .eq('sub_service_id', l.sub_service_id)
      .eq('period_year', periodYear)
      .eq('period_month', periodMonth)
      .eq('is_deleted', false)
      .maybeSingle();
    if (ex) {
      skipped++;
      continue;
    }

    const { data: created_row, error: insErr } = await sb.from('tasks').insert({
      client_id: l.client_id,
      sub_service_id: l.sub_service_id,
      title: `${ss.name} \u2014 ${periodMonth}/${periodYear}`,
      status: 'pending',
      priority: 'medium',
      due_date: dueDateStr,
      period_month: periodMonth,
      period_year: periodYear,
      is_recurring: true,
    }).select('id').single();
    if (insErr) { errors.push(insErr.message); continue; }
    created++;
    // Copy SOP steps onto the new task
    try {
      await seedTaskStepsFromSop(sb, { task_id: (created_row as any).id, sub_service_id: l.sub_service_id });
    } catch (e: any) {
      errors.push(`SOP copy failed for task ${(created_row as any).id}: ${e?.message ?? 'unknown'}`);
    }
  }

  return NextResponse.json({ ok: true, periodMonth, periodYear, created, skipped, errors });
}
