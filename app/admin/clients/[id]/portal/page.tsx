import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getClientById } from '@/lib/repositories/clients';
import { listClientVisibility } from '@/lib/repositories/portal-visibility';
import { PORTAL_MODULES } from '@/lib/auth/portal-visibility';
import PortalVisibilityForm from './visibility-form';

export const dynamic = 'force-dynamic';

export default async function ClientPortalTab({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);
  if (!client) notFound();
  const visibility = await listClientVisibility(params.id);

  return (
    <div className="space-y-8">
      <Link href={`/admin/clients/${params.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" /> Back to {(client as any).business_name}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portal modules</h1>
        <p className="text-zinc-500 mt-1">Choose which modules this client sees in their portal. Dashboard, Tasks and Queries are on by default.</p>
      </div>
      <PortalVisibilityForm clientId={params.id} modules={[...PORTAL_MODULES]} initial={visibility} />
    </div>
  );
}
