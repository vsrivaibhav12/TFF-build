import Link from 'next/link';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';
import { Plus, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminClientsList() {
  const clients = await listAccessibleClients();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-zinc-500 mt-1">Manage your firm’s client roster.</p>
        </div>
        <Button asChild data-testid="new-client-btn">
          <Link href="/admin/clients/new"><Plus className="h-4 w-4" /> New client</Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-12 text-center bg-zinc-50">
          <Building2 className="h-8 w-8 mx-auto text-zinc-400" />
          <div className="mt-3 font-medium text-zinc-900">No clients yet</div>
          <div className="text-sm text-zinc-500 mt-1">Add your first client to get started.</div>
          <Button asChild className="mt-4"><Link href="/admin/clients/new">Create client</Link></Button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>PAN</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c: any) => (
                <TableRow key={c.id} data-testid={`client-row-${c.id}`}>
                  <TableCell>
                    <Link href={`/admin/clients/${c.id}`} className="font-medium text-zinc-900 hover:text-teal-700">{c.business_name}</Link>
                    {c.primary_contact_email ? <div className="text-xs text-zinc-500">{c.primary_contact_email}</div> : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.pan ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{c.gstin ?? '—'}</TableCell>
                  <TableCell><Badge variant="teal">{c.lifecycle_stage}</Badge></TableCell>
                  <TableCell>{c.portal_enabled ? <Badge variant="success">Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}</TableCell>
                  <TableCell className="text-zinc-500">{formatDateIST(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
