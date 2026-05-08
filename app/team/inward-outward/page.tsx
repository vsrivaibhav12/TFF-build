import { listInwardOutward } from '@/lib/repositories/documents';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InwardOutwardForm from './form';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function InwardOutwardPage() {
  const [items, clients] = await Promise.all([listInwardOutward(), listAccessibleClients()]);
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inward / Outward Register</h1>
          <p className="text-zinc-500 mt-1">Physical document movement log across all clients.</p>
        </div>
        <InwardOutwardForm clients={clients as any}><Button data-testid="io-new">New entry</Button></InwardOutwardForm>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-sm text-zinc-500">No entries yet.</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Direction</TableHead><TableHead>Client</TableHead><TableHead>Description</TableHead><TableHead>Counterparty</TableHead><TableHead>Dates</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((i: any) => (
              <TableRow key={i.id} data-testid={`io-row-${i.id}`}>
                <TableCell><Badge variant={i.direction === 'inward' ? 'success' : 'outline'}>{i.direction}</Badge></TableCell>
                <TableCell className="font-medium">{i.clients?.business_name}</TableCell>
                <TableCell>{i.description}</TableCell>
                <TableCell className="text-xs">{i.received_from_name ?? i.handed_to_name ?? '—'}</TableCell>
                <TableCell className="text-xs">{formatDateIST(i.date_received)}{i.date_returned ? ` → ${formatDateIST(i.date_returned)}` : ''}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
