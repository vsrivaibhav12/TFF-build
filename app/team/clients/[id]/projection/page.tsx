import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/repositories/clients';
import { getLatestProjection } from '@/lib/services/tax-projection';
import { getClientServiceKinds } from '@/lib/auth/service-applicability';
import ProjectionForm from './projection-form';
import ServiceLocked from '@/components/shell/service-locked';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectionPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const kinds = await getClientServiceKinds(params.id);
  const allowed = kinds.has('income_tax') || kinds.has('compliance');
  if (!allowed) {
    return (
      <div className="space-y-6">
        <Link
          href={`/team/clients/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}
        </Link>
        <ServiceLocked
          kind="income_tax"
          clientId={params.id}
          clientName={(client as any).business_name}
          moduleLabel="Tax projection"
        />
      </div>
    );
  }
  const fy = new Date().getFullYear();
  const latest = await getLatestProjection(params.id, fy);
  return (
    <div className="space-y-8 max-w-3xl">
      <Link href={`/team/clients/${params.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}</Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax projection</h1>
        <p className="text-zinc-500 mt-1">Project annual liability + advance tax schedule based on best-available estimates.</p>
      </div>
      <ProjectionForm clientId={params.id} fyEndingYear={fy} initial={latest as any} />
    </div>
  );
}
