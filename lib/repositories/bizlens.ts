import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function getBizlensState(clientId: string, year: number, month: number) {
  const sb = createClient();
  const { data } = await sb
    .from('bizlens_data')
    .select('state_json, updated_at')
    .eq('client_id', clientId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();
  return data?.state_json ?? null;
}

export async function listBizlensMonths(clientId: string) {
  const sb = createClient();
  const { data } = await sb
    .from('bizlens_data')
    .select('month, year, updated_at')
    .eq('client_id', clientId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(24);
  return data ?? [];
}
