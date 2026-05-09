'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  previewClientImportAction,
  commitClientImportAction,
  type ImportPreview,
} from '@/lib/actions/client-import';

export default function ClientImportPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [pending, startTransition] = useTransition();

  function onPreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await previewClientImportAction(fd);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      setPreview(r.data);
      toast.success(
        `Parsed ${r.data.summary.total} row${r.data.summary.total === 1 ? '' : 's'}`,
      );
    });
  }

  function commit() {
    if (!preview) return;
    const ready = preview.rows.filter((r) => r.errors.length === 0);
    if (ready.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    startTransition(async () => {
      const r = await commitClientImportAction({
        file_name: preview.fileName,
        rows: preview.rows,
      });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `Imported ${(r as any).data.inserted} client${(r as any).data.inserted === 1 ? '' : 's'} · skipped ${(r as any).data.skipped} · failed ${(r as any).data.failed}`,
      );
      setPreview(null);
      router.push('/admin/clients');
    });
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" /> Clients
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk import clients</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload a CSV or Excel file. Each row becomes one client. We&apos;ll
          validate first; nothing is saved until you confirm.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 p-6 bg-white space-y-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-teal-600 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-medium">Expected columns (any order, case-insensitive):</p>
            <code className="block rounded bg-zinc-50 border border-zinc-200 p-3 text-xs leading-relaxed">
              business_name <span className="text-zinc-400">(required)</span>, pan, gstin, category,
              industry, primary_contact_person, primary_contact_email,
              primary_contact_phone, city, state, pincode
            </code>
            <p className="text-zinc-500 text-xs">
              <strong>category</strong> must be one of:{' '}
              sole_proprietor, partnership, llp, pvt_ltd, public_ltd, huf, aop,
              ngo, other.
            </p>
          </div>
        </div>

        <form onSubmit={onPreview} className="flex items-center gap-3 pt-2">
          <Input
            type="file"
            name="file"
            accept=".csv,.xlsx,.xls"
            required
            className="max-w-md"
            data-testid="import-file-input"
          />
          <Button type="submit" disabled={pending} data-testid="import-preview-btn">
            <Upload className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </form>
      </div>

      {preview && (
        <div className="space-y-4" data-testid="import-preview">
          <div className="rounded-xl border border-zinc-200 p-6 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{preview.fileName}</h3>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {preview.summary.ready} ready
                </Badge>
                {preview.summary.error > 0 && (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" /> {preview.summary.error} with errors
                  </Badge>
                )}
                <span className="text-sm text-zinc-500">
                  {preview.summary.total} total
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={commit}
                  disabled={pending || preview.summary.ready === 0}
                  data-testid="import-commit-btn"
                >
                  {pending
                    ? 'Importing…'
                    : `Import ${preview.summary.ready} client${preview.summary.ready === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr className="text-left text-zinc-500">
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Business name</th>
                    <th className="px-3 py-2 font-medium">PAN</th>
                    <th className="px-3 py-2 font-medium">GSTIN</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {preview.rows.map((r) => {
                    const hasErr = r.errors.length > 0;
                    return (
                      <tr
                        key={r.row_index}
                        className={hasErr ? 'bg-amber-50/40' : ''}
                        data-testid={`import-row-${r.row_index}`}
                      >
                        <td className="px-3 py-2 text-zinc-400">{r.row_index}</td>
                        <td className="px-3 py-2 font-medium">{r.business_name || '—'}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.pan ?? '—'}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.gstin ?? '—'}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.category ?? '—'}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.primary_contact_email ?? '—'}</td>
                        <td className="px-3 py-2">
                          {hasErr ? (
                            <span className="text-xs text-amber-700">
                              {r.errors.join('; ')}
                            </span>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              ready
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
