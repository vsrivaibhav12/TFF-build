import { listNotifications, getNotificationPreferences } from '@/lib/repositories/notifications';
import { requireUser } from '@/lib/auth/require-role';
import NotificationPrefsForm from './prefs-form';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const me = await requireUser();
  const [items, prefs] = await Promise.all([
    listNotifications(me.id, 50),
    getNotificationPreferences(me.id),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-zinc-500 mt-1">Your activity feed and email digest preferences.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold">Email digest</h2>
        <NotificationPrefsForm initial={prefs as any} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recent activity</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">
            Nothing yet. Activity from your tasks, queries, documents and compliance will appear here.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y">
            {items.map((n) => (
              <div key={n.id} data-testid={`notification-item-${n.id}`} className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900 truncate">{n.title}</div>
                  <div className="text-sm text-zinc-500 mt-0.5">{n.message}</div>
                  <div className="text-xs text-zinc-400 mt-1">{formatDateIST(n.created_at)}</div>
                </div>
                <Badge variant={n.is_read ? 'outline' : 'teal'}>{n.is_read ? 'read' : 'new'}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
