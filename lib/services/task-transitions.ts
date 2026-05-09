/**
 * Pure task transition state machine.
 * No 'server-only' marker — safe to import from both server and client code
 * (the data-mutating logic still lives in `task-service.ts` which is server-only).
 */
import type { TaskStatus } from '@/lib/validation/schemas';

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['awaiting_client', 'in_progress'],
  awaiting_client: ['in_progress'],
  in_progress: ['review', 'awaiting_client'],
  review: ['completed', 'in_progress'],
  completed: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: TaskStatus): TaskStatus[] {
  return TRANSITIONS[from] ?? [];
}
