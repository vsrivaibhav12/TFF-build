import Link from 'next/link';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { listSavedViews } from '@/lib/actions/saved-views';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';
import { Plus, Building2, Upload } from 'lucide-react';
import EmptyState from '@/components/sophistication/empty-state';
import SavedViewsBar from '@/components/sophistication/saved-views-bar';

export const dynamic = 'force-dynamic';

export default async function AdminClientsList() {
  const [clients, views] = await Promise.all([listAccessibleClients(), listSavedViews('admin.clients')]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-zinc-500 mt-1">Your firm&apos;s client roster.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="bulk-import-btn">
            <Link href="/admin/clients/import"><Upload className="h-4 w-4" /> Bulk import</Link>
          </Button>
          <Button asChild data-testid="new-client-btn">
            <Link href="/admin/clients/new"><Plus className="h-4 w-4" /> New client</Link>
          </Button>
        </div>
      </div>

      <SavedViewsBar scope="admin.clients" views={views as any} />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Onboard your first client and start tracking compliance, tasks, and queries in one place."
          actionHref="/admin/clients/new"
          actionLabel="Create client"
          icon={<Building2 className="h-6 w-6 text-zinc-400" />}
        />
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
