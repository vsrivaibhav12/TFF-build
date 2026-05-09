import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, listTaskActivity, listTaskNotes } from '@/lib/repositories/tasks';
import { listTeamUsers } from '@/lib/repositories/clients';
import { listTaskSteps } from '@/lib/repositories/task-steps';
import { listDocumentRequestsForTask } from '@/lib/repositories/document-requests';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import { formatDateIST } from '@/lib/utils';
import TaskActions from './task-actions';
import TaskStepsPanel from '@/components/tasks/task-steps-panel';
import SendReminderButton from '@/components/tasks/send-reminder-button';
import StuckToggle from '@/components/tasks/stuck-toggle';
import BlockedOnClientToggle from '@/components/tasks/blocked-on-client-toggle';
import DocumentRequestsPanel from '@/components/tasks/document-requests-panel';

export const dynamic = 'force-dynamic';

export default async function TeamTaskDetail({ params }: { params: { id: string } }) {
  const task = await getTask(params.id);
  if (!task) notFound();
  const [activity, notes, team, steps, docReqs] = await Promise.all([
    listTaskActivity(params.id),
    listTaskNotes(params.id),
    listTeamUsers(),
    listTaskSteps(params.id),
    listDocumentRequestsForTask(params.id),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/team/tasks"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Tasks
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge
            variant={
              task.status === 'completed'
                ? 'success'
                : task.status === 'in_progress'
                ? 'teal'
                : 'warning'
            }
          >
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline">{task.priority}</Badge>
          <span className="text-sm text-zinc-500">
            {(task as any).clients?.business_name}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {task.description || (
                <span className="text-zinc-400">No description</span>
              )}
            </p>
          </div>

          <StuckToggle
            taskId={task.id}
            isStuck={!!(task as any).is_stuck}
            reasonCode={(task as any).stuck_reason_code}
            reasonNote={(task as any).stuck_reason_note}
          />

          <TaskStepsPanel taskId={task.id} initial={steps as any} />

          <BlockedOnClientToggle
            taskId={task.id}
            isBlocked={!!(task as any).is_blocked_on_client}
          />

          <DocumentRequestsPanel
            taskId={task.id}
            subServiceId={(task as any).sub_service_id ?? null}
            initial={docReqs}
          />

          {(task as any).is_blocked_on_client && (
            <SendReminderButton taskId={task.id} />
          )}

          <TaskActions task={task} team={team} />

          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-4">Activity ({activity.length})</h3>
            <ul className="space-y-3 text-sm">
              {activity.map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <span className="text-zinc-400 w-32 shrink-0">
                    {formatDateIST(a.created_at)}
                  </span>
                  <span className="text-zinc-700">
                    <strong>{(a.users_profile as any)?.full_name || 'system'}</strong>{' '}
                    {a.action}
                    {a.field_name === 'status'
                      ? ` (${a.old_value || '—'} → ${a.new_value})`
                      : a.action === 'reminder_sent'
                      ? ` · ${a.new_value}`
                      : ''}
                  </span>
                </li>
              ))}
              {activity.length === 0 && (
                <li className="text-zinc-400">No activity yet</li>
              )}
            </ul>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Due</dt>
                <dd>{formatDateIST(task.due_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Period</dt>
                <dd>
                  {task.period_month && task.period_year
                    ? `${task.period_month}/${task.period_year}`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Assignee</dt>
                <dd>{(task as any).assignee?.full_name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Reviewer</dt>
                <dd>{(task as any).reviewer?.full_name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Sub-service</dt>
                <dd>{(task as any).sub_services?.code || '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Notes ({notes.length})</h3>
            <ul className="space-y-3 text-sm">
              {notes.map((n: any) => (
                <li
                  key={n.id}
                  className="border-b border-zinc-100 pb-3 last:border-0"
                >
                  <div className="text-xs text-zinc-500 mb-1">
                    {(n.users_profile as any)?.full_name} ·{' '}
                    {formatDateIST(n.created_at)}
                  </div>
                  <p className="whitespace-pre-wrap">{n.note_text}</p>
                </li>
              ))}
              {notes.length === 0 && <li className="text-zinc-400">No notes</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
