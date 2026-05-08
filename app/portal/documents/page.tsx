import { listDocuments } from '@/lib/repositories/documents';
import { Badge } from '@/components/ui/badge';
import { formatDateIST } from '@/lib/utils';
import { Download, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PortalDocumentsPage() {
  const docs = await listDocuments({ visibleToClient: true });
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-zinc-500 mt-1">Files shared by your engagement team.</p>
      </div>
      {docs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">
          No documents shared with you yet. New uploads will appear here automatically.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">
          {docs.map((d: any) => (
            <Link key={d.id} href={d.file_url} target="_blank" className="flex items-center justify-between p-4 hover:bg-zinc-50" data-testid={`portal-doc-${d.id}`}>
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.file_name}</div>
                  <div className="text-xs text-zinc-500">{d.document_category} · {formatDateIST(d.created_at)}</div>
                </div>
              </div>
              <Download className="h-4 w-4 text-zinc-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
