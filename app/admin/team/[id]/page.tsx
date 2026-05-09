import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listGrantedCapabilities } from '@/lib/repositories/staff-capabilities';
import { listRoleTemplates } from '@/lib/repositories/role-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import ApplyRoleControl from './apply-role-control';

export const dynamic = 'force-dynamic';

export default async function AdminTeamMemberPage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: user } = await sb
    .from('users_profile')
    .select('id, full_name, email, role, is_active, phone, active_role_template_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!user) notFound();
  const [caps, templates] = await Promise.all([
    listGrantedCapabilities(params.id),
    listRoleTemplates(),
  ]);
  const activeTemplate = templates.find((t) => t.id === (user as any).active_role_template_id);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/team"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back to team
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{(user as any).full_name}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant={(user as any).role === 'admin' ? 'teal' : 'outline'}>
              {(user as any).role}
            </Badge>
            <span className="text-sm text-zinc-500">{(user as any).email}</span>
            {activeTemplate && (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> {activeTemplate.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(user as any).role !== 'admin' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Apply a role
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Pick a role template to bulk-grant the right capabilities. Manage
              templates from{' '}
              <Link href="/admin/team/roles" className="text-teal-700 hover:underline">
                Team &rarr; Roles
              </Link>
              .
            </p>
          </div>
          <ApplyRoleControl
            userId={(user as any).id}
            templates={templates}
            activeTemplateId={(user as any).active_role_template_id}
          />
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Capabilities
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              {(user as any).role === 'admin'
                ? 'Admins implicitly hold every capability.'
                : `${caps.length} of 25 granted.`}
            </p>
          </div>
          {(user as any).role !== 'admin' && (
            <Link href={`/admin/team/${params.id}/capabilities`}>
              <Button variant="outline" data-testid="manage-capabilities">
                Override individually
              </Button>
            </Link>
          )}
        </div>
        {(user as any).role !== 'admin' && caps.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {caps.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
