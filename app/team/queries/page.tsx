import Link from 'next/link';
import { listQueries } from '@/lib/repositories/queries';
import { listSavedViews } from '@/lib/actions/saved-views';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import EmptyState from '@/components/sophistication/empty-state';
import SavedViewsBar from '@/components/sophistication/saved-views-bar';
import { MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamQueries({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status?.split(',').filter(Boolean) as any;
  const [items, views] = await Promise.all([
    listQueries(status?.length ? { status } : { status: ['open', 'in_progress'] }),
    listSavedViews('team.queries'),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queries</h1>
        <p className="text-zinc-500 mt-1">Threaded Q&amp;A with your clients.</p>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{v:'',l:'Open + In progress'},{v:'open',l:'Open'},{v:'in_progress',l:'In progress'},{v:'resolved',l:'Resolved'},{v:'closed',l:'Closed'}].map((f) => (
            <Link key={f.v} href={f.v ? `/team/queries?status=${f.v}` : '/team/queries'} className={`rounded-md border px-3 py-1.5 text-xs ${(searchParams.status ?? '') === f.v ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-zinc-200 hover:bg-zinc-50'}`}>{f.l}</Link>
          ))}
        </div>
        <SavedViewsBar scope="team.queries" views={views as any} />
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No queries match this view"
          body="Queries appear here when clients ask something through the portal, or when your team raises an internal one."
          icon={<MessageSquare className="h-6 w-6 text-zinc-400" />}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">{items.map((q: any) => (
          <Link key={q.id} href={`/team/queries/${q.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50" data-testid={`query-row-${q.id}`}>
            <div><div className="font-medium">{q.subject}</div><div className="text-xs text-zinc-500">{q.clients?.business_name} · {q.creator?.full_name} · {formatDateIST(q.updated_at)}</div></div>
            <Badge variant={q.status === 'open' ? 'warning' : q.status === 'in_progress' ? 'teal' : 'success'}>{q.status.replace(/_/g, ' ')}</Badge>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
