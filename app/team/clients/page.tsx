import { listAccessibleClients } from '@/lib/repositories/clients';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function TeamClientsList() {
  const clients = await listAccessibleClients();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-zinc-500 mt-1">{clients.length} client(s) you can access (RLS-filtered).</p>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-zinc-500 text-sm">No clients assigned. Ask an admin to add you to a client.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>PAN</TableHead><TableHead>GSTIN</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader>
            <TableBody>{clients.map((c: any) => (
              <TableRow key={c.id}><TableCell><Link href={`/team/clients/${c.id}`} className="font-medium hover:text-teal-700">{c.business_name}</Link></TableCell><TableCell className="font-mono text-xs">{c.pan ?? '—'}</TableCell><TableCell className="font-mono text-xs">{c.gstin ?? '—'}</TableCell><TableCell><Badge variant="teal">{c.lifecycle_stage}</Badge></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
