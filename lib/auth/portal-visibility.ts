import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const PORTAL_MODULES = [
  'portal.dashboard', 'portal.tasks', 'portal.documents', 'portal.queries',
  'portal.bizlens', 'portal.vcfo', 'portal.compliance_calendar', 'portal.insights',
  'portal.tax_projection', 'portal.notices', 'portal.vendors',
] as const;
export type PortalModule = typeof PORTAL_MODULES[number];

/**
 * Returns the set of enabled module keys across ALL clients linked to the user.
 * portal.dashboard is always implicitly visible.
 */
export async function getVisibleModulesForCurrentClient(): Promise<Set<PortalModule>> {
  const sb = createClient();
  const { data } = await sb
    .from('client_portal_visibility')
    .select('module_key, is_enabled');
  const out = new Set<PortalModule>();
  out.add('portal.dashboard');
  for (const r of data ?? []) if ((r as any).is_enabled) out.add((r as any).module_key as PortalModule);
  return out;
}

export async function ensureModuleVisible(key: PortalModule): Promise<void> {
  if (key === 'portal.dashboard') return;
  const set = await getVisibleModulesForCurrentClient();
  if (!set.has(key)) notFound();
}
