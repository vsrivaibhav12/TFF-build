import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ServiceError } from '@/lib/actions/result';
import type { AppUser } from '@/lib/auth/require-role';

/**
 * Closed list of named capabilities (v1). Do not invent new ones.
 */
export const ALL_CAPABILITIES = [
  'clients.read.all', 'clients.create', 'clients.edit', 'clients.delete',
  'clients.assign_team', 'clients.toggle_portal',
  'services.manage', 'services.assign',
  'staff.manage', 'staff.grant_capabilities',
  'dsc.manage', 'credentials.manage',
  'tasks.assign', 'tasks.complete',
  'compliance.enter', 'notices.manage',
  'bizlens.enter', 'vcfo.enter',
  'payroll.run',
  'attendance.approve', 'leave.approve',
  'documents.upload', 'documents.delete',
  'queries.assign',
  'audit.view', 'firm_dashboard.view', 'insights.configure',
] as const;
export type Capability = typeof ALL_CAPABILITIES[number];

/**
 * Returns true if the user has the capability. Admin implicitly has all.
 * Caller can assume requireRole has already run.
 */
export async function hasCapability(user: AppUser, capability: Capability): Promise<boolean> {
  if (user.role === 'admin') return true;
  const sb = createClient();
  const { data } = await sb
    .from('staff_capabilities')
    .select('id')
    .eq('user_id', user.id)
    .eq('capability', capability)
    .is('revoked_at', null)
    .maybeSingle();
  return !!data;
}

export async function requireCapability(user: AppUser, capability: Capability): Promise<void> {
  const ok = await hasCapability(user, capability);
  if (!ok) {
    throw new ServiceError(`Missing capability: ${capability}`, 'NO_CAPABILITY');
  }
}

/**
 * Hard variant for use directly in pages (not actions): redirects to / if missing.
 */
export async function requireCapabilityOrRedirect(user: AppUser, capability: Capability) {
  if (!(await hasCapability(user, capability))) redirect('/');
}

export async function listCapabilitiesForUser(userId: string): Promise<Capability[]> {
  const sb = createClient();
  const { data } = await sb
    .from('staff_capabilities')
    .select('capability')
    .eq('user_id', userId)
    .is('revoked_at', null);
  return (data ?? []).map((r: any) => r.capability);
}
