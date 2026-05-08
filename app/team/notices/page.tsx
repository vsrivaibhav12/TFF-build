import { listAllNotices } from '@/lib/repositories/notices';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NoticeDialog from './notice-dialog';
import { formatDateIST, formatCurrencyINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamNoticesPage() {
  const [items, clients] = await Promise.all([listAllNotices(), listAccessibleClients()]);
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-zinc-500 mt-1">Tax department correspondence across all assigned clients.</p>
        </div>
        <NoticeDialog clients={clients as any}><Button data-testid="notice-new">New notice</Button></NoticeDialog>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No notices logged. Add the first one to begin tracking deadlines.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Type</TableHead><TableHead>Number</TableHead><TableHead>Subject</TableHead><TableHead>Due</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((n: any) => (
              <TableRow key={n.id} data-testid={`notice-row-${n.id}`}>
                <TableCell className="font-medium">{n.clients?.business_name}</TableCell>
                <TableCell><Badge variant="outline">{n.notice_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{n.notice_number ?? '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{n.subject ?? '—'}</TableCell>
                <TableCell>{formatDateIST(n.due_date)}</TableCell>
                <TableCell className="tabular-nums">{formatCurrencyINR(n.amount_involved, { compact: true })}</TableCell>
                <TableCell><Badge variant={n.status === 'closed' ? 'success' : 'warning'}>{n.status.replace(/_/g, ' ')}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
