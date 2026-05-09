'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { upsertClientComplianceProfileAction } from '@/lib/actions/compliance-calendar';

interface Profile {
  client_id?: string;
  gst_filing_frequency?: string | null;
  state_group?: string | null;
  entity_type?: string | null;
  is_audit_applicable?: boolean;
  is_tds_deductor?: boolean;
  is_tcs_collector?: boolean;
  is_advance_tax_applicable?: boolean;
  is_pf_applicable?: boolean;
  is_esi_applicable?: boolean;
  is_pt_applicable?: boolean;
  pt_state?: string | null;
  is_roc_applicable?: boolean;
  agm_date?: string | null;
  is_transfer_pricing?: boolean;
  annual_turnover_estimate?: number | null;
  fy_start_month?: number;
  notes?: string | null;
}

export default function ComplianceProfileForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: Profile | null;
}) {
  const router = useRouter();
  const [f, setF] = useState<Profile>({
    client_id: clientId,
    gst_filing_frequency: initial?.gst_filing_frequency ?? null,
    state_group: initial?.state_group ?? null,
    entity_type: initial?.entity_type ?? null,
    is_audit_applicable: !!initial?.is_audit_applicable,
    is_tds_deductor: !!initial?.is_tds_deductor,
    is_tcs_collector: !!initial?.is_tcs_collector,
    is_advance_tax_applicable: !!initial?.is_advance_tax_applicable,
    is_pf_applicable: !!initial?.is_pf_applicable,
    is_esi_applicable: !!initial?.is_esi_applicable,
    is_pt_applicable: !!initial?.is_pt_applicable,
    pt_state: initial?.pt_state ?? null,
    is_roc_applicable: !!initial?.is_roc_applicable,
    agm_date: initial?.agm_date ?? null,
    is_transfer_pricing: !!initial?.is_transfer_pricing,
    annual_turnover_estimate: initial?.annual_turnover_estimate ?? null,
    fy_start_month: initial?.fy_start_month ?? 4,
    notes: initial?.notes ?? null,
  });
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Profile>(k: K, v: any) {
    setF((p) => ({ ...p, [k]: v }));
  }

  function save() {
    startTransition(async () => {
      const r = await upsertClientComplianceProfileAction({
        ...(f as any),
        client_id: clientId,
        annual_turnover_estimate: f.annual_turnover_estimate ?? null,
        agm_date: f.agm_date || null,
        gst_filing_frequency: f.gst_filing_frequency || null,
        state_group: f.state_group || null,
        entity_type: f.entity_type || null,
        pt_state: f.pt_state || null,
      });
      if (!r.success) toast.error(r.error);
      else {
        toast.success(`Saved · ${(r as any).data?.refreshed ?? 0} calendar events refreshed`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">Entity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Entity type</Label>
            <Select value={f.entity_type ?? ''} onValueChange={(v) => set('entity_type', v || null)}>
              <SelectTrigger data-testid="ccp-entity-type"><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>
                {['company','llp','firm','proprietorship','huf','trust','aop','boi','individual'].map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>FY start month</Label>
            <Input type="number" min={1} max={12} value={f.fy_start_month ?? 4} onChange={(e) => set('fy_start_month', parseInt(e.target.value || '4', 10))} />
          </div>
          <div className="space-y-1.5">
            <Label>Estimated annual turnover (₹)</Label>
            <Input type="number" value={f.annual_turnover_estimate ?? ''} onChange={(e) => set('annual_turnover_estimate', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">GST</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Filing frequency</Label>
            <Select value={f.gst_filing_frequency ?? ''} onValueChange={(v) => set('gst_filing_frequency', v || null)}>
              <SelectTrigger data-testid="ccp-gst-freq"><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="qrmp">QRMP (quarterly)</SelectItem>
                <SelectItem value="not_applicable">Not applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>State group (for QRMP)</Label>
            <Select value={f.state_group ?? ''} onValueChange={(v) => set('state_group', v || null)}>
              <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Group A (22nd due)</SelectItem>
                <SelectItem value="B">Group B (24th due — incl. TN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Income tax</h2>
        <Toggle label="Tax audit u/s 44AB applicable" v={!!f.is_audit_applicable} onChange={(v) => set('is_audit_applicable', v)} testid="ccp-audit" />
        <Toggle label="Advance tax applicable" v={!!f.is_advance_tax_applicable} onChange={(v) => set('is_advance_tax_applicable', v)} testid="ccp-adv-tax" />
        <Toggle label="Transfer pricing applicable" v={!!f.is_transfer_pricing} onChange={(v) => set('is_transfer_pricing', v)} testid="ccp-tp" />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">TDS / TCS</h2>
        <Toggle label="TDS deductor" v={!!f.is_tds_deductor} onChange={(v) => set('is_tds_deductor', v)} testid="ccp-tds" />
        <Toggle label="TCS collector" v={!!f.is_tcs_collector} onChange={(v) => set('is_tcs_collector', v)} testid="ccp-tcs" />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">ROC</h2>
        <Toggle label="ROC compliance applicable" v={!!f.is_roc_applicable} onChange={(v) => set('is_roc_applicable', v)} testid="ccp-roc" />
        {f.is_roc_applicable && (
          <div className="space-y-1.5">
            <Label>AGM date (latest)</Label>
            <Input type="date" value={f.agm_date ?? ''} onChange={(e) => set('agm_date', e.target.value || null)} />
            <p className="text-xs text-zinc-500">AOC-4 due 30d after AGM, MGT-7 due 60d after AGM.</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Payroll</h2>
        <Toggle label="PF applicable" v={!!f.is_pf_applicable} onChange={(v) => set('is_pf_applicable', v)} testid="ccp-pf" />
        <Toggle label="ESI applicable" v={!!f.is_esi_applicable} onChange={(v) => set('is_esi_applicable', v)} testid="ccp-esi" />
        <Toggle label="Profession Tax applicable" v={!!f.is_pt_applicable} onChange={(v) => set('is_pt_applicable', v)} testid="ccp-pt" />
        {f.is_pt_applicable && (
          <div className="space-y-1.5">
            <Label>PT state</Label>
            <Input value={f.pt_state ?? ''} onChange={(e) => set('pt_state', e.target.value)} placeholder="TN" maxLength={4} />
            <p className="text-xs text-zinc-500">Currently only TN rule is seeded (Apr / Oct half-yearly).</p>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending} data-testid="ccp-save">
          {pending ? 'Saving…' : 'Save & refresh calendar'}
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, v, onChange, testid }: { label: string; v: boolean; onChange: (v: boolean) => void; testid?: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={v} onCheckedChange={onChange} data-testid={testid} />
    </div>
  );
}
