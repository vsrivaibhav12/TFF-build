import BizLensFrame from '../../team/clients/[id]/bizlens/bizlens-frame';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function PortalBizLensPage() {
  await requireRole('client');
  const sb = createClient();
  // Pick the first client_id this user is linked to (RLS auto-scopes).
  const { data: cu } = await sb
    .from('client_users')
    .select('client_id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  const clientId = (cu as any)?.client_id ?? null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BizLens</h1>
        <p className="text-zinc-500 mt-1">Your business analytics workspace.</p>
      </div>
      {!clientId ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No business linked to your account yet.</div>
      ) : (
        <BizLensFrame clientId={clientId} mode="portal" />
      )}
    </div>
  );
}
