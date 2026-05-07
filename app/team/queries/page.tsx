import Link from 'next/link';
import { listQueries } from '@/lib/repositories/queries';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamQueries() {
  const items = await listQueries({ status: ['open', 'in_progress'] });
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queries</h1>
        <p className="text-zinc-500 mt-1">Open queries from your clients.</p>
      </div>
      {items.length === 0 ? <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No open queries.</div> : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">{items.map((q: any) => (
          <Link key={q.id} href={`/team/queries/${q.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50"><div><div className="font-medium">{q.subject}</div><div className="text-xs text-zinc-500">{q.clients?.business_name} · {q.creator?.full_name} · {formatDateIST(q.updated_at)}</div></div><Badge variant={q.status === 'open' ? 'warning' : 'teal'}>{q.status}</Badge></Link>
        ))}</div>
      )}
    </div>
  );
}
