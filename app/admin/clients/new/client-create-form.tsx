'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClientAction } from '@/lib/actions/clients';
import { toast } from 'sonner';

const STATE_BY_CODE: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh',
};

const CATEGORIES = ['sole_proprietor', 'partnership', 'llp', 'pvt_ltd', 'public_ltd', 'huf', 'aop', 'ngo', 'other'] as const;
const STAGES = ['lead', 'onboarding', 'active', 'paused', 'churned'] as const;

interface Props {
  groups: { id: string; name: string }[];
  owners: { id: string; full_name: string; email: string }[];
}

export default function ClientCreateForm({ groups, owners }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    business_name: '',
    pan: '',
    gstin: '',
    category: '' as (typeof CATEGORIES)[number] | '',
    industry: '',
    primary_contact_person: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    city: '',
    state: '',
    pincode: '',
    lifecycle_stage: 'lead' as (typeof STAGES)[number],
    primary_owner_id: '',
    group_id: '',
    portal_enabled: false,
    notes: '',
  });

  function set<K extends keyof typeof f>(k: K, v: any) { setF((p) => ({ ...p, [k]: v })); }

  function onGstinChange(v: string) {
    const upper = v.toUpperCase();
    set('gstin', upper);
    if (upper.length >= 2 && !f.state) {
      const stateName = STATE_BY_CODE[upper.slice(0, 2)];
      if (stateName) set('state', stateName);
    }
  }

  function save() {
    if (!f.business_name.trim()) { toast.error('Business name is required'); return; }
    startTransition(async () => {
      const payload: any = { ...f };
      if (!payload.category) payload.category = null;
      if (!payload.primary_owner_id) payload.primary_owner_id = null;
      if (!payload.group_id) payload.group_id = null;
      const r = await createClientAction(payload);
      if (r.success) {
        toast.success('Client saved. Add services from the Services tab.');
        router.push(`/admin/clients/${(r as any).data.id}`);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <Section title="Business">
        <div className="space-y-2">
          <Label htmlFor="bn">Business name <span className="text-red-600">*</span></Label>
          <Input id="bn" required value={f.business_name} onChange={(e) => set('business_name', e.target.value)} data-testid="client-business-name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>PAN</Label><Input value={f.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} /></div>
          <div className="space-y-2"><Label>GSTIN</Label><Input value={f.gstin} onChange={(e) => onGstinChange(e.target.value)} placeholder="33ABCDE1234F1Z5" maxLength={15} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={f.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Industry</Label><Input value={f.industry} onChange={(e) => set('industry', e.target.value)} /></div>
        </div>
      </Section>

      <Section title="Primary contact">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Person</Label><Input value={f.primary_contact_person} onChange={(e) => set('primary_contact_person', e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={f.primary_contact_phone} onChange={(e) => set('primary_contact_phone', e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={f.primary_contact_email} onChange={(e) => set('primary_contact_email', e.target.value)} /></div>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>City</Label><Input value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div className="space-y-2"><Label>State</Label><Input value={f.state} onChange={(e) => set('state', e.target.value)} placeholder="Auto-fills from GSTIN" /></div>
          <div className="space-y-2"><Label>Pincode</Label><Input value={f.pincode} onChange={(e) => set('pincode', e.target.value)} /></div>
        </div>
      </Section>

      <Section title="Engagement">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Lifecycle stage</Label>
            <Select value={f.lifecycle_stage} onValueChange={(v) => set('lifecycle_stage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary owner</Label>
            <Select value={f.primary_owner_id} onValueChange={(v) => set('primary_owner_id', v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>{owners.map((o) => <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {groups.length > 0 && (
          <div className="space-y-2">
            <Label>Group</Label>
            <Select value={f.group_id} onValueChange={(v) => set('group_id', v)}>
              <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>{groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-4 bg-zinc-50/50">
          <div>
            <Label>Enable client portal access</Label>
            <p className="text-xs text-zinc-500 mt-1">When enabled, you'll choose what they see in the Portal tab after this client is created.</p>
          </div>
          <Switch checked={f.portal_enabled} onCheckedChange={(v) => set('portal_enabled', !!v)} data-testid="client-portal-enabled" />
        </div>
      </Section>

      <Section title="Internal notes">
        <Textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/clients')}>Cancel</Button>
        <Button type="submit" disabled={pending} data-testid="client-save">{pending ? 'Saving…' : 'Save client'}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
