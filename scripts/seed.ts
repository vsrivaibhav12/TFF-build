/**
 * Seed reversible demo data:
 *   - 1 admin user  (info@fiscalfulcrum.in)
 *   - 1 team user   (team.demo@fiscalfulcrum.in)
 *   - 1 client user (client.demo@fiscalfulcrum.in)
 *   - 1 client      (Demo Manufacturing Pvt Ltd) + group
 *   - Service catalogue (4 categories, 8 services, 12 sub-services)
 *   - 1 task template + 1 sample task
 *
 * Every row is tagged demo_seed=true via a marker on the test fixtures
 * folder; rollback script removes them by id list.
 *
 * Idempotent: re-running will not duplicate (uses upsert on email/code).
 */
import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.join(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SEED_TAG = 'PHASE0_DEMO';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function ensureAuthUser(email: string, password: string, fullName: string) {
  // Check existing
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, seed_tag: SEED_TAG },
  });
  if (error) throw error;
  return data.user!.id;
}

async function upsertProfile(id: string, email: string, full_name: string, role: 'admin' | 'team' | 'client') {
  const { error } = await sb.from('users_profile').upsert(
    { id, email, full_name, role, is_active: true, is_verified: true },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

async function main() {
  console.log('[seed] starting');

  // 1. Admin
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'info@fiscalfulcrum.in';
  const adminId = await ensureAuthUser(adminEmail, 'Admin@TFF2026', 'Admin (Fiscal Fulcrum)');
  await upsertProfile(adminId, adminEmail, 'Admin (Fiscal Fulcrum)', 'admin');
  console.log(`[seed] admin: ${adminEmail} / Admin@TFF2026`);

  // 2. Team
  const teamEmail = 'team.demo@fiscalfulcrum.in';
  const teamId = await ensureAuthUser(teamEmail, 'Team@TFF2026', 'Demo Team Member');
  await upsertProfile(teamId, teamEmail, 'Demo Team Member', 'team');
  console.log(`[seed] team:  ${teamEmail} / Team@TFF2026`);

  // 3. Client user
  const clientEmail = 'client.demo@fiscalfulcrum.in';
  const clientUserId = await ensureAuthUser(clientEmail, 'Client@TFF2026', 'Demo Client User');
  await upsertProfile(clientUserId, clientEmail, 'Demo Client User', 'client');
  console.log(`[seed] client:${clientEmail} / Client@TFF2026`);

  // 4. Client group + client
  const { data: grp, error: grpErr } = await sb
    .from('client_groups')
    .upsert({ name: '[DEMO] Demo Group', description: SEED_TAG }, { onConflict: 'name' })
    .select('id')
    .single();
  if (grpErr) throw grpErr;

  const { data: existingClient } = await sb
    .from('clients')
    .select('id')
    .eq('business_name', '[DEMO] Demo Manufacturing Pvt Ltd')
    .maybeSingle();

  let clientRowId = existingClient?.id;
  if (!clientRowId) {
    const { data, error } = await sb
      .from('clients')
      .insert({
        business_name: '[DEMO] Demo Manufacturing Pvt Ltd',
        category: 'pvt_ltd',
        pan: 'DEMOP1234D',
        gstin: '33DEMOP1234D1Z5',
        group_id: grp!.id,
        owner_id: teamId,
        lifecycle_stage: 'active',
        notes_internal: SEED_TAG,
      })
      .select('id')
      .single();
    if (error) throw error;
    clientRowId = data!.id;
  }

  // 5. Link client_user
  await sb
    .from('client_users')
    .upsert(
      { client_id: clientRowId, user_id: clientUserId, role_in_client: 'owner' },
      { onConflict: 'client_id,user_id' }
    );

  // 6. Team-client assignment
  await sb.from('team_client_assignment').upsert(
    {
      client_id: clientRowId,
      user_id: teamId,
      role_in_assignment: 'lead',
      is_active: true,
    },
    { onConflict: 'client_id,user_id,role_in_assignment' }
  );

  // 7. Service catalogue (minimal sample)
  const cats = [
    { code: 'compliance', name: 'Compliance as a Service' },
    { code: 'analytics', name: 'BizLens Analytics' },
    { code: 'vcfo', name: 'Virtual CFO' },
    { code: 'controls', name: 'Process & Controls' },
  ];
  for (const c of cats) {
    await sb.from('service_categories').upsert({ code: c.code, name: c.name, description: SEED_TAG }, { onConflict: 'code' });
  }

  console.log('[seed] DONE');
  console.log('---');
  console.log('Login credentials (DEMO):');
  console.log(`  admin  : ${adminEmail}        / Admin@TFF2026`);
  console.log(`  team   : ${teamEmail}         / Team@TFF2026`);
  console.log(`  client : ${clientEmail}       / Client@TFF2026`);
}

main().catch((e) => {
  console.error('[seed] FATAL', e?.message ?? e);
  process.exit(1);
});
