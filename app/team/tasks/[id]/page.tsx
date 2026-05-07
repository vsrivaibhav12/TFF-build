import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, listTaskActivity, listTaskNotes } from '@/lib/repositories/tasks';
import { listTeamUsers } from '@/lib/repositories/clients';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import { formatDateIST } from '@/lib/utils';
import TaskActions from './task-actions';

export const dynamic = 'force-dynamic';

export default async function TeamTaskDetail({ params }: { params: { id: string } }) {
  const task = await getTask(params.id);
  if (!task) notFound();
  const [activity, notes, team] = await Promise.all([
    listTaskActivity(params.id),
    listTaskNotes(params.id),
    listTeamUsers(),
  ]);

  return (
    <div className="space-y-8">
      <Link href="/team/tasks" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /> Tasks</Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'teal' : 'warning'}>{task.status.replace('_', ' ')}</Badge>
          <Badge variant="outline">{task.priority}</Badge>
          <span className="text-sm text-zinc-500">{(task as any).clients?.business_name}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{task.description || <span className="text-zinc-400">No description</span>}</p>
          </div>
          <TaskActions task={task} team={team} />
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-4">Activity ({activity.length})</h3>
            <ul className="space-y-3 text-sm">{activity.map((a: any) => (
              <li key={a.id} className="flex gap-3"><span className="text-zinc-400 w-32 shrink-0">{formatDateIST(a.created_at)}</span><span className="text-zinc-700"><strong>{(a.users_profile as any)?.full_name || 'system'}</strong> {a.action}{a.field_name === 'status' ? ` (${a.old_value || '—'} → ${a.new_value})` : ''}</span></li>
            ))}{activity.length === 0 && <li className="text-zinc-400">No activity yet</li>}</ul>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Due</dt><dd>{formatDateIST(task.due_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Period</dt><dd>{task.period_month && task.period_year ? `${task.period_month}/${task.period_year}` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Assignee</dt><dd>{(task as any).assignee?.full_name || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Reviewer</dt><dd>{(task as any).reviewer?.full_name || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Sub-service</dt><dd>{(task as any).sub_services?.code || '—'}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <h3 className="font-semibold mb-3">Notes ({notes.length})</h3>
            <ul className="space-y-3 text-sm">{notes.map((n: any) => (
              <li key={n.id} className="border-b border-zinc-100 pb-3 last:border-0"><div className="text-xs text-zinc-500 mb-1">{(n.users_profile as any)?.full_name} · {formatDateIST(n.created_at)}</div><p className="whitespace-pre-wrap">{n.note_text}</p></li>
            ))}{notes.length === 0 && <li className="text-zinc-400">No notes</li>}</ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
