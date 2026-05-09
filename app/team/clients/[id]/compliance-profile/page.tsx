import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft } from 'lucide-react';
import ComplianceProfileForm from './profile-form';

export const dynamic = 'force-dynamic';

export default async function ClientComplianceProfilePage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: client } = await sb
    .from('clients')
    .select('id, business_name, gstin, pan, state')
    .eq('id', params.id)
    .maybeSingle();
  if (!client) notFound();
  const { data: profile } = await sb
    .from('client_compliance_profiles')
    .select('*')
    .eq('client_id', params.id)
    .maybeSingle();
  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={`/team/clients/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> {(client as any).business_name}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance profile</h1>
        <p className="text-zinc-500 mt-1">
          Tells the calendar which statutory events apply to this client. Saving here
          regenerates calendar events immediately.
        </p>
      </div>
      <ComplianceProfileForm clientId={params.id} initial={profile as any} />
    </div>
  );
}
