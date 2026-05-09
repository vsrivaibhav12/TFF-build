import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { TaskStatus } from '@/lib/validation/schemas';

export async function listTasks(opts: {
  clientId?: string;
  assignedTo?: string;
  status?: Array<TaskStatus | 'blocked' | 'stuck'>;
  limit?: number;
} = {}) {
  const sb = createClient();
  let q = sb
    .from('tasks')
    .select('id, title, status, priority, due_date, period_year, period_month, assigned_to, reviewer_id, sub_service_id, client_id, is_blocked_on_client, is_stuck, stuck_reason_code, verification_status, created_at, updated_at, clients(id, business_name)')
    .eq('is_deleted', false)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (opts.clientId) q = q.eq('client_id', opts.clientId);
  if (opts.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (opts.status?.length) {
    // Pseudo-statuses 'blocked' and 'stuck' are flags, not enum values.
    const realStatuses = opts.status.filter((s): s is TaskStatus =>
      s === 'pending' || s === 'in_progress' || s === 'completed' || s === 'cancelled',
    );
    if (opts.status.includes('blocked')) q = q.eq('is_blocked_on_client', true);
    else if (opts.status.includes('stuck')) q = q.eq('is_stuck', true);
    else if (realStatuses.length > 0) q = q.in('status', realStatuses);
  }
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getTask(id: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('tasks')
    .select('*, clients(id, business_name), sub_services(code, name, services(name)), assignee:users_profile!tasks_assigned_to_fkey(id, full_name, email), reviewer:users_profile!tasks_reviewer_id_fkey(id, full_name, email)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listTaskActivity(taskId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('task_activity')
    .select('id, action, field_name, old_value, new_value, created_at, users_profile(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listTaskNotes(taskId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('task_notes')
    .select('id, note_text, created_at, users_profile(full_name, email, role)')
    .eq('task_id', taskId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function countTasksByStatus(opts: { assignedTo?: string; clientId?: string } = {}) {
  const sb = createClient();
  let q = sb.from('tasks').select('status').eq('is_deleted', false);
  if (opts.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (opts.clientId) q = q.eq('client_id', opts.clientId);
  const { data, error } = await q;
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    counts[(r as any).status] = (counts[(r as any).status] || 0) + 1;
  }
  return counts;
}
