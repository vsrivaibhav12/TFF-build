import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { listQueries } from '@/lib/repositories/queries';
import { listAccessibleClients } from '@/lib/repositories/clients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateIST } from '@/lib/utils';
import NewQueryDialog from './new-query';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalQueries() {
  const me = await requireRole('client');
  const [items, clients] = await Promise.all([
    listQueries({ mineOnly: true, userId: me.id }),
    listAccessibleClients(),
  ]);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queries</h1>
          <p className="text-zinc-500 mt-1">Open a question to your CA team.</p>
        </div>
        <NewQueryDialog clients={clients as any} />
      </div>
      {items.length === 0 ? <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No queries yet. Click “Raise query” to start a conversation.</div> : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">{items.map((q: any) => (
          <Link key={q.id} href={`/portal/queries/${q.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50"><div><div className="font-medium">{q.subject}</div><div className="text-xs text-zinc-500">{q.clients?.business_name} · {formatDateIST(q.updated_at)}</div></div><Badge variant={q.status === 'open' ? 'warning' : q.status === 'resolved' ? 'success' : 'teal'}>{q.status}</Badge></Link>
        ))}</div>
      )}
    </div>
  );
}
