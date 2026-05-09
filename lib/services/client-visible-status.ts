/**
 * Map an internal task to the client-visible status (v3 #4).
 * Pure function — safe to import from server or client code.
 *
 * Internal fields used:
 *   - status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
 *   - is_blocked_on_client: boolean
 *   - is_stuck: boolean
 *   - client_approval_required: boolean
 *
 * Output: one of 6 client-friendly statuses. Portal must NEVER expose
 * internal status, reviewer name, SOP step counts, or assignee name.
 */
export type ClientVisibleStatus =
  | 'upcoming'
  | 'awaiting_your_data'
  | 'in_process'
  | 'awaiting_your_approval'
  | 'filed_done'
  | 'stuck'
  | 'cancelled';

export interface TaskForClientView {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | string;
  is_blocked_on_client?: boolean | null;
  is_stuck?: boolean | null;
  client_approval_required?: boolean | null;
}

export function getClientVisibleStatus(task: TaskForClientView): ClientVisibleStatus {
  if (task.is_stuck) return 'stuck';
  if (task.status === 'completed') return 'filed_done';
  if (task.status === 'cancelled') return 'cancelled';
  if (task.is_blocked_on_client) return 'awaiting_your_data';
  if (task.client_approval_required) return 'awaiting_your_approval';
  if (task.status === 'in_progress') return 'in_process';
  return 'upcoming';
}

export const CLIENT_VISIBLE_LABELS: Record<ClientVisibleStatus, string> = {
  upcoming: 'Upcoming',
  awaiting_your_data: 'Awaiting your data',
  in_process: 'In process',
  awaiting_your_approval: 'Awaiting your approval',
  filed_done: 'Filed / Done',
  stuck: 'Stuck',
  cancelled: 'Cancelled',
};

/**
 * Tailwind-compatible Badge variants per client-visible status.
 * Keeps colors in lock-step with our zinc/teal/amber/red palette.
 */
export const CLIENT_VISIBLE_VARIANTS: Record<
  ClientVisibleStatus,
  'outline' | 'success' | 'warning' | 'teal' | 'destructive'
> = {
  upcoming: 'outline',
  awaiting_your_data: 'warning',
  in_process: 'teal',
  awaiting_your_approval: 'warning',
  filed_done: 'success',
  stuck: 'destructive',
  cancelled: 'outline',
};
