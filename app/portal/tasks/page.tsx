import Link from 'next/link';
import { listTasks } from '@/lib/repositories/tasks';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalTasks() {
  // RLS already filters to awaiting_client + completed for clients per schema
  const tasks = await listTasks({});
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My tasks</h1>
        <p className="text-zinc-500 mt-1">Tasks awaiting you and recently completed work.</p>
      </div>
      {tasks.length === 0 ? <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No tasks visible.</div> : (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{tasks.map((t: any) => (
              <TableRow key={t.id}><TableCell><Link href={`/portal/tasks/${t.id}`} className="font-medium hover:text-teal-700">{t.title}</Link></TableCell><TableCell>{formatDateIST(t.due_date)}</TableCell><TableCell><Badge variant={t.status === 'completed' ? 'success' : 'warning'}>{t.status.replace('_', ' ')}</Badge></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
