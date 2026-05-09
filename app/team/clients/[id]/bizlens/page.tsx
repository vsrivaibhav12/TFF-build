import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/repositories/clients';
import { listBizlensMonths } from '@/lib/repositories/bizlens';
import { clientHasServiceKind } from '@/lib/auth/service-applicability';
import BizLensFrame from './bizlens-frame';
import ServiceLocked from '@/components/shell/service-locked';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientBizLensPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();

  const allowed = await clientHasServiceKind(params.id, 'bizlens');
  const months = await listBizlensMonths(params.id);

  return (
    <div className="space-y-6">
      <Link
        href={`/team/clients/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          BizLens · {(client as any).business_name}
        </h1>
        {allowed && (
          <p className="text-zinc-500 mt-1">
            {months.length > 0
              ? `${months.length} month(s) on record.`
              : 'No data yet — enter the first month below.'}
          </p>
        )}
      </div>
      {allowed ? (
        <BizLensFrame clientId={params.id} mode="team" />
      ) : (
        <ServiceLocked
          kind="bizlens"
          clientId={params.id}
          clientName={(client as any).business_name}
          moduleLabel="BizLens"
        />
      )}
    </div>
  );
}
