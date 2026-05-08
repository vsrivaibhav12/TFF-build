'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveBizlensStateAction } from '@/lib/actions/bizlens';
import { toast } from 'sonner';
import { Loader2, Save, RefreshCw } from 'lucide-react';

/**
 * Embeds the standalone BizLens HTML/JS app from /public/bizlens-app/.
 *
 * Bridge:
 *   parent  → child:  postMessage({ type: 'bizlens:init', clientId, month, year, state })
 *   child   → parent: postMessage({ type: 'bizlens:state', state })  on every change
 *   parent persists to bizlens_data via Server Action (debounced).
 *
 * NOTE: The legacy bizlens-app.js does not yet emit 'bizlens:state'. Until that
 * one-liner is wired into its update path, the parent provides a manual "Save"
 * button that snapshots the iframe's localStorage. Logic of the BizLens app is
 * unchanged.
 */
export default function BizLensFrame({ clientId, mode }: { clientId: string; mode: 'team' | 'portal' }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const readonly = mode === 'portal';

  // Initial state hydrate
  useEffect(() => {
    async function hydrate() {
      try {
        const r = await fetch(`/api/bizlens/state?clientId=${clientId}&year=${period.year}&month=${period.month}`, { cache: 'no-store' });
        const j = await r.json();
        const initialState = j.state ?? null;
        // Send initial state once iframe is ready
        const iframe = ref.current;
        if (!iframe?.contentWindow) return;
        iframe.contentWindow.postMessage({ type: 'bizlens:init', clientId, year: period.year, month: period.month, state: initialState, readonly }, '*');
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load state');
      }
    }
    if (loaded) hydrate();
  }, [loaded, clientId, period.year, period.month, readonly]);

  function snapshotAndSave() {
    const iframe = ref.current;
    if (!iframe?.contentWindow) return;
    // Ask child to dump its localStorage; the legacy app stores under known keys.
    try {
      const win: any = iframe.contentWindow;
      const storage: Record<string, any> = {};
      // Best-effort: walk known keys. We don't know them all so dump everything in localStorage.
      try {
        const ls = win.localStorage;
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (!k) continue;
          try { storage[k] = JSON.parse(ls.getItem(k) ?? 'null'); }
          catch { storage[k] = ls.getItem(k); }
        }
      } catch {
        // Cross-origin guard — will not happen because we serve from same origin.
      }
      startTransition(async () => {
        const r = await saveBizlensStateAction({ client_id: clientId, year: period.year, month: period.month, state_json: storage });
        if (r.success) toast.success('BizLens state saved');
        else toast.error(r.error);
      });
    } catch (e: any) {
      toast.error('Could not snapshot iframe state: ' + (e?.message ?? 'unknown'));
    }
  }

  function reload() {
    if (ref.current) ref.current.src = ref.current.src;
    setLoaded(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-end gap-3">
          <div className="space-y-1"><Label className="text-xs">Year</Label><Input type="number" value={period.year} onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })} className="w-24" /></div>
          <div className="space-y-1"><Label className="text-xs">Month</Label><Input type="number" min={1} max={12} value={period.month} onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })} className="w-20" /></div>
          <Button variant="outline" onClick={reload} size="sm"><RefreshCw className="h-3 w-3" /> Reload</Button>
        </div>
        {!readonly && (
          <Button onClick={snapshotAndSave} disabled={pending} data-testid="bizlens-save">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save snapshot
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <iframe
          ref={ref}
          src="/bizlens-app/index.html"
          title="BizLens"
          onLoad={() => setLoaded(true)}
          className="w-full h-[80vh] border-0"
          data-testid="bizlens-iframe"
        />
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        BizLens is embedded as the existing module to preserve all calculations exactly. State persists per <code>client_id + month + year</code> via the Save button. Internal client-management UI is overridden by TFF’s scoping.
      </div>
    </div>
  );
}
