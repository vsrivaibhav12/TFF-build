import Link from 'next/link';
import { listClientGroups, listTeamUsers } from '@/lib/repositories/clients';
import ClientForm from '../client-form';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewClientPage() {
  const [groups, owners] = await Promise.all([listClientGroups(), listTeamUsers()]);
  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" /> Back to clients
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New client</h1>
        <p className="text-zinc-500 mt-1">Required: business name. Everything else can be filled in later.</p>
      </div>
      <ClientForm groups={groups} owners={owners} />
    </div>
  );
}
