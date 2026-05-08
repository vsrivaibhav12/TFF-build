import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/require-role';
import { getBizlensState } from '@/lib/repositories/bizlens';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ state: null }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!clientId || !year || !month) return NextResponse.json({ error: 'missing params' }, { status: 400 });
  const state = await getBizlensState(clientId, year, month);
  return NextResponse.json({ state });
}
