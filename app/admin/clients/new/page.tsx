import Link from 'next/link';
import { listClientGroups, listTeamUsers } from '@/lib/repositories/clients';
import { listServices } from '@/lib/repositories/services';
import OnboardingWizard from './wizard';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewClientPage() {
  const [groups, owners, services] = await Promise.all([
    listClientGroups(),
    listTeamUsers(),
    listServices(),
  ]);
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" /> Back to clients
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New client</h1>
        <p className="text-zinc-500 mt-1">Walk through profile, services, team and portal in four steps. Skip anything you don&apos;t have yet.</p>
      </div>
      <OnboardingWizard
        groups={groups as any}
        owners={owners as any}
        services={services as any}
      />
    </div>
  );
}
