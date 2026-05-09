import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, listTaskNotes } from '@/lib/repositories/tasks';
import { listTaskSteps } from '@/lib/repositories/task-steps';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import { formatDateIST } from '@/lib/utils';
import ClientNoteForm from './note-form';
import TaskStepsReadOnly from '@/components/tasks/task-steps-readonly';

export const dynamic = 'force-dynamic';

export default async function PortalTaskDetail({ params }: { params: { id: string } }) {
  const task = await getTask(params.id);
  if (!task) notFound();
  const [notes, steps] = await Promise.all([
    listTaskNotes(params.id),
    listTaskSteps(params.id),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href="/portal/tasks"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Tasks
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
            {task.status.replace('_', ' ')}
          </Badge>
          <span className="text-sm text-zinc-500">
            due {formatDateIST(task.due_date)}
          </span>
        </div>
      </div>

      {task.description && (
        <div className="rounded-xl border border-zinc-200 p-6 bg-white">
          <h3 className="font-semibold mb-3">What we need from you</h3>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      )}

      <TaskStepsReadOnly steps={steps as any} />

      <div className="rounded-xl border border-zinc-200 p-6 bg-white">
        <h3 className="font-semibold mb-3">Conversation</h3>
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
          {notes.length === 0 && (
            <li className="text-zinc-400">Nothing yet</li>
          )}
        </ul>
      </div>
      <ClientNoteForm taskId={task.id} />
    </div>
  );
}
