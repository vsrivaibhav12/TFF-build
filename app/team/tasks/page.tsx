import Link from 'next/link';
import { listTasks } from '@/lib/repositories/tasks';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamTasksList({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status?.split(',').filter(Boolean) as any;
  const tasks = await listTasks({ status });
  const filters: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'awaiting_client', label: 'Awaiting client' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'review', label: 'In review' },
    { value: 'completed', label: 'Completed' },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-zinc-500 mt-1">{tasks.length} task(s).</p>
      </div>
      <div className="flex gap-2 flex-wrap">{filters.map((f) => (
        <Link key={f.value} href={f.value ? `/team/tasks?status=${f.value}` : '/team/tasks'} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs hover:border-zinc-300 hover:bg-zinc-50" data-testid={`filter-${f.value || 'all'}`}>{f.label}</Link>
      ))}</div>
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 text-zinc-500 text-sm bg-zinc-50">No tasks. Tasks are auto-created monthly via cron, or manually from a client page.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Client</TableHead><TableHead>Period</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader>
            <TableBody>{tasks.map((t: any) => (
              <TableRow key={t.id}><TableCell><Link href={`/team/tasks/${t.id}`} className="font-medium hover:text-teal-700">{t.title}</Link></TableCell><TableCell>{t.clients?.business_name}</TableCell><TableCell className="text-zinc-500">{t.period_month && t.period_year ? `${t.period_month}/${t.period_year}` : '—'}</TableCell><TableCell>{formatDateIST(t.due_date)}</TableCell><TableCell><Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'teal' : 'warning'}>{t.status.replace('_', ' ')}</Badge></TableCell><TableCell><Badge variant="outline">{t.priority}</Badge></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
