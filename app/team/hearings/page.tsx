import { listHearings } from '@/lib/repositories/notices';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST, formatCurrencyINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HearingsPage() {
  const items = await listHearings();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hearings</h1>
        <p className="text-zinc-500 mt-1">Cross-client hearings calendar.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No hearings scheduled.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Type</TableHead><TableHead>Subject</TableHead><TableHead>Scheduled</TableHead><TableHead>Officer</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((h: any) => (
              <TableRow key={h.id} data-testid={`hearing-row-${h.id}`}>
                <TableCell className="font-medium">{h.clients?.business_name}</TableCell>
                <TableCell><Badge variant="outline">{h.hearing_type ?? '—'}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{h.subject ?? '—'}</TableCell>
                <TableCell>{formatDateIST(h.hearing_scheduled_date)}</TableCell>
                <TableCell>{h.officer_name ?? '—'}</TableCell>
                <TableCell><Badge variant={h.status === 'concluded' ? 'success' : 'warning'}>{h.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
