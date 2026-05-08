import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ clients: [] }, { status: 401 });
  const q = (new URL(req.url)).searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json({ clients: [] });
  const sb = createClient();
  const { data } = await sb
    .from('clients')
    .select('id, business_name, gstin, pan')
    .eq('is_deleted', false)
    .or(`business_name.ilike.%${q}%,gstin.ilike.%${q}%,pan.ilike.%${q}%`)
    .limit(10);
  return NextResponse.json({ clients: data ?? [] });
}
