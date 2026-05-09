import Link from 'next/link';
import { listTasks } from '@/lib/repositories/tasks';
import { listAccessibleClients, listTeamUsers } from '@/lib/repositories/clients';
import { listSavedViews } from '@/lib/actions/saved-views';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';
import EmptyState from '@/components/sophistication/empty-state';
import SavedViewsBar from '@/components/sophistication/saved-views-bar';
import NewTaskDialog from '@/components/tasks/new-task-dialog';
import TasksTableClient from './tasks-table-client';
import { Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamTasksList({ searchParams }: { searchParams: { status?: string; priority?: string } }) {
  const status = searchParams.status?.split(',').filter(Boolean) as any;
  const [tasks, clients, team, views] = await Promise.all([
    listTasks({ status }),
    listAccessibleClients(),
    listTeamUsers(),
    listSavedViews('team.tasks'),
  ]);
  const filters: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'blocked', label: 'Awaiting client' },
    { value: 'stuck', label: 'Stuck' },
    { value: 'completed', label: 'Completed' },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-zinc-500 mt-1">{tasks.length} task{tasks.length === 1 ? '' : 's'} in this view.</p>
        </div>
        <NewTaskDialog clients={clients as any} team={team as any} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">{filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/team/tasks?status=${f.value}` : '/team/tasks'}
            className={`rounded-md border px-3 py-1.5 text-xs ${(searchParams.status ?? '') === f.value ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-zinc-200 hover:bg-zinc-50'}`}
            data-testid={`filter-${f.value || 'all'}`}
          >{f.label}</Link>
        ))}</div>
        <SavedViewsBar scope="team.tasks" views={views as any} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks here yet"
          body="Tasks are auto-created from sub-services on the 1st of every month, or you can add one now."
          icon={<Briefcase className="h-6 w-6 text-zinc-400" />}
        />
      ) : (
        <TasksTableClient tasks={tasks as any} />
      )}
    </div>
  );
}
