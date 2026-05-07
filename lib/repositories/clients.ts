import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function listAccessibleClients() {
  const sb = createClient();
  const { data, error } = await sb
    .from('clients')
    .select('id, business_name, pan, gstin, category, lifecycle_stage, primary_contact_person, primary_contact_email, primary_owner_id, group_id, portal_enabled, created_at, updated_at')
    .eq('is_deleted', false)
    .order('business_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getClientById(id: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('clients')
    .select('*, client_groups(name)')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClientGroups() {
  const sb = createClient();
  const { data, error } = await sb
    .from('client_groups')
    .select('id, name, description')
    .eq('is_deleted', false)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function listTeamUsers() {
  const sb = createClient();
  const { data, error } = await sb
    .from('users_profile')
    .select('id, full_name, email, role, is_active')
    .in('role', ['team', 'admin'])
    .eq('is_active', true)
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function listClientUsers(clientId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('client_users')
    .select('id, role_in_client, is_active, user_id, users_profile(id, full_name, email)')
    .eq('client_id', clientId);
  if (error) throw error;
  return data ?? [];
}

export async function listTeamAssignments(clientId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('team_client_assignment')
    .select('id, role, assigned_from, assigned_to, team_user_id, users_profile(id, full_name, email)')
    .eq('client_id', clientId)
    .order('assigned_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
