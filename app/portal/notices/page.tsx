import { ensureModuleVisible } from '@/lib/auth/portal-visibility';
import { listAllNotices } from '@/lib/repositories/notices';
import { Badge } from '@/components/ui/badge';
import { formatDateIST, formatCurrencyINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalNoticesPage() {
  await ensureModuleVisible('portal.notices');
  const items = await listAllNotices();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-zinc-500 mt-1">Notices addressed to your business and the engagement team’s response status.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No notices on record. We’ll add anything we receive.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">
          {items.map((n: any) => (
            <div key={n.id} className="p-5" data-testid={`portal-notice-${n.id}`}>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{n.notice_type}</Badge>
                {n.notice_number && <span className="font-mono text-xs text-zinc-500">{n.notice_number}</span>}
                <Badge variant={n.status === 'closed' ? 'success' : 'warning'} className="ml-auto">{n.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="mt-2 font-medium">{n.subject ?? '—'}</div>
              <div className="mt-1 text-xs text-zinc-500">Due {formatDateIST(n.due_date)} · {formatCurrencyINR(n.amount_involved, { compact: true })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
