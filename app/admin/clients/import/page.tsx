import ClientImportForm from './import-form';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDateIST } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

async function getRecentBatches() {
  const sb = createClient();
  const { data } = await sb
    .from('client_import_batches')
    .select(
      'id, source_filename, total_rows, successful_rows, skipped_rows, error_rows, status, uploaded_at, users_profile:uploaded_by(full_name)',
    )
    .order('uploaded_at', { ascending: false })
    .limit(10);
  return data ?? [];
}

export default async function ClientImportPage() {
  const batches = await getRecentBatches();
  return (
    <div className="space-y-12">
      <ClientImportForm />

      <div className="max-w-5xl">
        <h2 className="text-lg font-semibold mb-4">Recent imports</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-zinc-400">No imports yet.</p>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-left text-zinc-500">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">File</th>
                  <th className="px-3 py-2 font-medium">By</th>
                  <th className="px-3 py-2 font-medium text-right">Inserted</th>
                  <th className="px-3 py-2 font-medium text-right">Skipped</th>
                  <th className="px-3 py-2 font-medium text-right">Failed</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {batches.map((b: any) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 text-zinc-500">{formatDateIST(b.uploaded_at)}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/admin/clients/import/${b.id}`} className="hover:underline">
                        {b.source_filename ?? '—'}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {b.users_profile?.full_name ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">{b.successful_rows}</td>
                    <td className="px-3 py-2 text-right">{b.skipped_rows}</td>
                    <td className="px-3 py-2 text-right">{b.error_rows}</td>
                    <td className="px-3 py-2">
                      <Badge variant={b.status === 'completed' ? 'success' : 'outline'}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
