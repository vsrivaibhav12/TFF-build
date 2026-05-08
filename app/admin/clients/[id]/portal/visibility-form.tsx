'use client';
import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { setPortalVisibilityAction } from '@/lib/actions/portal-visibility';
import { toast } from 'sonner';

const MODULE_LABELS: Record<string, { label: string; description: string }> = {
  'portal.dashboard': { label: 'Dashboard', description: 'Overview of tasks, queries and recent activity.' },
  'portal.tasks': { label: 'Tasks', description: 'Items needing the client’s action.' },
  'portal.documents': { label: 'Documents', description: 'Files marked visible by the team.' },
  'portal.queries': { label: 'Queries', description: 'Threaded Q&A with the engagement team.' },
  'portal.bizlens': { label: 'BizLens', description: 'Embedded analytics dashboard.' },
  'portal.vcfo': { label: 'vCFO', description: 'Runway, variance and advisor notes.' },
  'portal.compliance_calendar': { label: 'Compliance calendar', description: 'Upcoming due dates across filings.' },
  'portal.insights': { label: 'Insights', description: 'Inline observations and recommendations.' },
  'portal.tax_projection': { label: 'Tax projection', description: 'Projected liability and advance tax schedule.' },
  'portal.notices': { label: 'Notices', description: 'Tax department notices and replies.' },
  'portal.vendors': { label: 'Vendors', description: 'Vendor compliance status (GST, TDS).' },
};

export default function PortalVisibilityForm({ clientId, modules, initial }: { clientId: string; modules: string[]; initial: Record<string, boolean> }) {
  const [state, setState] = useState<Record<string, boolean>>(initial);
  const [pending, startTransition] = useTransition();

  function toggle(mod: string, next: boolean) {
    if (mod === 'portal.dashboard') return; // always on
    const prev = state[mod];
    setState((s) => ({ ...s, [mod]: next }));
    startTransition(async () => {
      const r = await setPortalVisibilityAction({ client_id: clientId, module_key: mod as any, is_enabled: next });
      if (!r.success) {
        // rollback
        setState((s) => ({ ...s, [mod]: prev }));
        toast.error(r.error);
      } else {
        toast.success(`${MODULE_LABELS[mod]?.label ?? mod} ${next ? 'enabled' : 'disabled'}`);
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white divide-y">
      {modules.map((m) => {
        const meta = MODULE_LABELS[m] ?? { label: m, description: '' };
        const isOn = !!state[m];
        const locked = m === 'portal.dashboard';
        return (
          <div key={m} className="flex items-start justify-between p-5">
            <div className="min-w-0 mr-4">
              <div className="flex items-center gap-2">
                <Label className="font-medium text-zinc-900">{meta.label}</Label>
                {locked && <Badge variant="outline">always on</Badge>}
                <span className="font-mono text-[10px] text-zinc-400">{m}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{meta.description}</p>
            </div>
            <Switch
              checked={isOn}
              disabled={locked || pending}
              onCheckedChange={(v) => toggle(m, !!v)}
              data-testid={`module-toggle-${m}`}
            />
          </div>
        );
      })}
    </div>
  );
}
