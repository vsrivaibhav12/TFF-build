import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/repositories/clients';
import { listClientSubServices } from '@/lib/repositories/services';
import { listTasks } from '@/lib/repositories/tasks';
import {
  listGstFilings,
  listTdsFilings,
  listItFilings,
  listNotices,
} from '@/lib/repositories/compliance';
import { getClientServiceKinds } from '@/lib/auth/service-applicability';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, BarChart3, Sparkles, FileText, ScrollText } from 'lucide-react';
import { formatDateIST, formatCurrencyINR } from '@/lib/utils';
import ComplianceEntry from './compliance-entry';

export const dynamic = 'force-dynamic';

export default async function TeamClientDetail({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const [subs, tasks, gst, tds, it, notices, kinds] = await Promise.all([
    listClientSubServices(params.id),
    listTasks({ clientId: params.id, limit: 50 }),
    listGstFilings(params.id),
    listTdsFilings(params.id),
    listItFilings(params.id),
    listNotices(params.id),
    getClientServiceKinds(params.id),
  ]);

  // Service-applicability gating
  const showCompliance = kinds.has('gst') || kinds.has('tds') || kinds.has('income_tax') || kinds.has('compliance') || gst.length > 0 || tds.length > 0 || it.length > 0;
  const showNotices = kinds.has('notice') || kinds.has('compliance') || notices.length > 0;
  const showBizlens = kinds.has('bizlens');
  const showVcfo = kinds.has('vcfo');
  const showProjection = kinds.has('income_tax') || kinds.has('compliance');

  return (
    <div className="space-y-8">
      <Link
        href="/team/clients"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{client.business_name}</h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="teal">{client.lifecycle_stage}</Badge>
          {client.pan && (
            <span className="text-sm font-mono text-zinc-500">{client.pan}</span>
          )}
          {client.gstin && (
            <span className="text-sm font-mono text-zinc-500">{client.gstin}</span>
          )}
          {kinds.size > 0 && (
            <span className="text-xs text-zinc-400">·</span>
          )}
          {[...kinds].sort().map((k) => (
            <Badge key={k} variant="outline" className="text-[10px] uppercase">
              {k.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick action chips for subscribed advisory modules + compliance profile */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/team/clients/${params.id}/compliance-profile`}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:border-teal-300 hover:bg-teal-50/30"
          data-testid="quick-compliance-profile"
        >
          <FileText className="h-3.5 w-3.5 text-teal-600" /> Compliance profile
        </Link>
        {showBizlens && (
          <Link
            href={`/team/clients/${params.id}/bizlens`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:border-teal-300 hover:bg-teal-50/30"
            data-testid="quick-bizlens"
          >
            <BarChart3 className="h-3.5 w-3.5 text-teal-600" /> BizLens
          </Link>
        )}
        {showVcfo && (
          <Link
            href={`/team/clients/${params.id}/vcfo`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:border-teal-300 hover:bg-teal-50/30"
            data-testid="quick-vcfo"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" /> vCFO
          </Link>
        )}
        {showProjection && (
          <Link
            href={`/team/clients/${params.id}/projection`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:border-teal-300 hover:bg-teal-50/30"
            data-testid="quick-projection"
          >
            <FileText className="h-3.5 w-3.5 text-teal-600" /> Tax projection
          </Link>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            Tasks ({tasks.length})
          </TabsTrigger>
          {showCompliance && (
            <TabsTrigger value="compliance" data-testid="tab-compliance">
              Compliance
            </TabsTrigger>
          )}
          {showNotices && (
            <TabsTrigger value="notices" data-testid="tab-notices">
              Notices ({notices.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 p-6 bg-white">
              <h3 className="font-semibold mb-3">Contact</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Person</dt>
                  <dd>{client.primary_contact_person || '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd>{client.primary_contact_email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd>{client.primary_contact_phone || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6 bg-white">
              <h3 className="font-semibold mb-3">Subscribed sub-services</h3>
              {subs.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  None yet.{' '}
                  <Link
                    href={`/admin/clients/${params.id}`}
                    className="text-teal-700 hover:underline"
                  >
                    Assign a service
                  </Link>{' '}
                  to unlock data-entry modules.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {subs.map((s: any) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.sub_services?.name}</span>
                      <Badge variant="outline">{s.sub_services?.frequency}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-zinc-500 text-sm">
              No tasks yet.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white divide-y">
              {tasks.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/team/tasks/${t.id}`}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50"
                >
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-zinc-500">
                      due {formatDateIST(t.due_date)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      t.status === 'completed'
                        ? 'success'
                        : t.status === 'in_progress'
                        ? 'teal'
                        : 'warning'
                    }
                  >
                    {t.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {showCompliance && (
          <TabsContent value="compliance">
            <ComplianceEntry
              clientId={client.id}
              gst={gst as any}
              tds={tds as any}
              it={it as any}
            />
          </TabsContent>
        )}

        {showNotices && (
          <TabsContent value="notices">
            {notices.length === 0 ? (
              <div className="text-sm text-zinc-500 p-6 flex items-center gap-2">
                <ScrollText className="h-4 w-4" /> No notices on file.
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 divide-y bg-white">
                {notices.map((n: any) => (
                  <div key={n.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{n.subject || n.notice_type}</div>
                      <Badge variant="warning">{n.status}</Badge>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {n.notice_type} · received {formatDateIST(n.notice_received_date)}{' '}
                      · due {formatDateIST(n.due_date)}
                      {n.amount_involved
                        ? ` · ${formatCurrencyINR(Number(n.amount_involved))}`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
