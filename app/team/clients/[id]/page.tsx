import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/repositories/clients';
import { listClientSubServices } from '@/lib/repositories/services';
import { listTasks } from '@/lib/repositories/tasks';
import { listGstFilings, listTdsFilings, listItFilings, listNotices } from '@/lib/repositories/compliance';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft } from 'lucide-react';
import { formatDateIST, formatCurrencyINR } from '@/lib/utils';
import ComplianceEntry from './compliance-entry';

export const dynamic = 'force-dynamic';

export default async function TeamClientDetail({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const [subs, tasks, gst, tds, it, notices] = await Promise.all([
    listClientSubServices(params.id),
    listTasks({ clientId: params.id, limit: 50 }),
    listGstFilings(params.id),
    listTdsFilings(params.id),
    listItFilings(params.id),
    listNotices(params.id),
  ]);

  return (
    <div className="space-y-8">
      <Link href="/team/clients" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /> Back</Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{client.business_name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="teal">{client.lifecycle_stage}</Badge>
          {client.pan && <span className="text-sm font-mono text-zinc-500">{client.pan}</span>}
          {client.gstin && <span className="text-sm font-mono text-zinc-500">{client.gstin}</span>}
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="notices" data-testid="tab-notices">Notices ({notices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 p-6 bg-white">
              <h3 className="font-semibold mb-3">Contact</h3>
              <dl className="space-y-2 text-sm"><div><dt className="text-zinc-500">Person</dt><dd>{client.primary_contact_person || '—'}</dd></div><div><dt className="text-zinc-500">Email</dt><dd>{client.primary_contact_email || '—'}</dd></div><div><dt className="text-zinc-500">Phone</dt><dd>{client.primary_contact_phone || '—'}</dd></div></dl>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6 bg-white">
              <h3 className="font-semibold mb-3">Subscribed sub-services</h3>
              {subs.length === 0 ? <p className="text-sm text-zinc-500">None</p> : <ul className="space-y-2 text-sm">{subs.map((s: any) => <li key={s.id} className="flex justify-between"><span>{s.sub_services?.name}</span><Badge variant="outline">{s.sub_services?.frequency}</Badge></li>)}</ul>}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tasks">
          {tasks.length === 0 ? <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-zinc-500 text-sm">No tasks yet.</div> : (
            <div className="rounded-xl border border-zinc-200 bg-white divide-y">{tasks.map((t: any) => (
              <Link key={t.id} href={`/team/tasks/${t.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50"><div><div className="font-medium">{t.title}</div><div className="text-xs text-zinc-500">due {formatDateIST(t.due_date)}</div></div><Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'teal' : 'warning'}>{t.status}</Badge></Link>
            ))}</div>
          )}
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceEntry clientId={client.id} gst={gst as any} tds={tds as any} it={it as any} />
        </TabsContent>
        <TabsContent value="notices">
          {notices.length === 0 ? <div className="text-sm text-zinc-500 p-6">No notices on file.</div> : <div className="rounded-xl border border-zinc-200 divide-y bg-white">{notices.map((n: any) => <div key={n.id} className="p-4"><div className="flex items-center justify-between"><div className="font-medium">{n.subject || n.notice_type}</div><Badge variant="warning">{n.status}</Badge></div><div className="text-xs text-zinc-500 mt-1">{n.notice_type} · received {formatDateIST(n.notice_received_date)} · due {formatDateIST(n.due_date)}{n.amount_involved ? ` · ${formatCurrencyINR(Number(n.amount_involved))}` : ''}</div></div>)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
