import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientById, listClientUsers, listTeamAssignments, listTeamUsers, listClientGroups } from '@/lib/repositories/clients';
import { listClientServices, listClientSubServices } from '@/lib/repositories/services';
import { listGstFilings, listTdsFilings, listItFilings } from '@/lib/repositories/compliance';
import ClientForm from '../client-form';
import ClientServiceManager from './service-manager';
import ClientTeamManager from './team-manager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminClientDetail({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const [groups, owners, clientServices, clientSubServices, clientUsers, teamAssignments, gst, tds, it] = await Promise.all([
    listClientGroups(),
    listTeamUsers(),
    listClientServices(params.id),
    listClientSubServices(params.id),
    listClientUsers(params.id),
    listTeamAssignments(params.id),
    listGstFilings(params.id),
    listTdsFilings(params.id),
    listItFilings(params.id),
  ]);

  return (
    <div className="space-y-8">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" /> Back to clients
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.business_name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="teal">{client.lifecycle_stage}</Badge>
            {client.pan && <span className="text-sm text-zinc-500 font-mono">PAN {client.pan}</span>}
            {client.gstin && <span className="text-sm text-zinc-500 font-mono">GSTIN {client.gstin}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="portal" data-testid="tab-portal" asChild><Link href={`/admin/clients/${client.id}/portal`}>Portal</Link></TabsTrigger>
          <TabsTrigger value="vcfo" data-testid="tab-vcfo" asChild><Link href={`/team/clients/${client.id}/vcfo`}>vCFO</Link></TabsTrigger>
          <TabsTrigger value="bizlens" data-testid="tab-bizlens" asChild><Link href={`/team/clients/${client.id}/bizlens`}>BizLens</Link></TabsTrigger>
          <TabsTrigger value="projection" data-testid="tab-projection" asChild><Link href={`/team/clients/${client.id}/projection`}>Projection</Link></TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ClientForm groups={groups} owners={owners} initial={client} />
        </TabsContent>
        <TabsContent value="services">
          <ClientServiceManager
            clientId={client.id}
            existingSubServices={clientSubServices as any}
            existingServices={clientServices as any}
          />
        </TabsContent>
        <TabsContent value="team">
          <ClientTeamManager
            clientId={client.id}
            assignments={teamAssignments as any}
            availableTeam={owners}
            clientUsers={clientUsers as any}
          />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceSummary gst={gst} tds={tds} it={it} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComplianceSummary({ gst, tds, it }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { title: 'GST filings', items: gst, fields: ['return_type', 'period_year', 'period_month', 'status'] },
        { title: 'TDS filings', items: tds, fields: ['period_quarter', 'period_year', 'status'] },
        { title: 'Income tax', items: it, fields: ['fy_ending_year', 'status'] },
      ].map((b) => (
        <div key={b.title} className="rounded-xl border border-zinc-200 p-6">
          <h4 className="font-medium text-zinc-900">{b.title}</h4>
          <p className="text-xs text-zinc-500 mt-1">{b.items.length} record(s)</p>
          <ul className="mt-3 space-y-2 text-sm">
            {b.items.slice(0, 5).map((i: any) => (
              <li key={i.id} className="flex justify-between">
                <span className="text-zinc-700">{b.fields.map((f) => i[f]).filter(Boolean).join(' · ')}</span>
                <Badge variant={i.status === 'filed' ? 'success' : 'warning'}>{i.status}</Badge>
              </li>
            ))}
            {b.items.length === 0 && <li className="text-zinc-400">None</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
