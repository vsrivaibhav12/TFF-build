import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Smart empty state. Picks contextual copy + a single primary action.
 * Use everywhere a list might be empty so users always know the next step.
 */
export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  icon = <Inbox className="h-6 w-6 text-zinc-400" />,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center" data-testid="empty-state">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white border border-zinc-200">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">{body}</p>
      {actionHref && actionLabel && (
        <div className="mt-6">
          <Link href={actionHref}><Button size="sm" data-testid="empty-action">{actionLabel}</Button></Link>
        </div>
      )}
    </div>
  );
}
