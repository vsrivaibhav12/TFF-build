import Link from 'next/link';
import { listTasks } from '@/lib/repositories/tasks';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';
import {
  getClientVisibleStatus,
  CLIENT_VISIBLE_LABELS,
  CLIENT_VISIBLE_VARIANTS,
} from '@/lib/services/client-visible-status';

export const dynamic = 'force-dynamic';

export default async function PortalTasks() {
  // RLS scopes rows to this client's tasks only.
  const tasks = await listTasks({});
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My tasks</h1>
        <p className="text-zinc-500 mt-1">
          Tasks waiting on you, in progress, and recently filed.
        </p>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">
          No tasks visible.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t: any) => {
                const cs = getClientVisibleStatus(t);
                return (
                  <TableRow key={t.id} data-testid={`portal-task-row-${t.id}`}>
                    <TableCell>
                      <Link
                        href={`/portal/tasks/${t.id}`}
                        className="font-medium hover:text-teal-700"
                      >
                        {t.title}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateIST(t.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant={CLIENT_VISIBLE_VARIANTS[cs] as any} data-testid={`portal-task-status-${t.id}`}>
                        {CLIENT_VISIBLE_LABELS[cs]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
