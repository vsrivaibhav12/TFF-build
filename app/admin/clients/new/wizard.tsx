'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createClientAction, updateClientAction, assignTeamMemberAction } from '@/lib/actions/clients';
import { linkServiceToClientAction } from '@/lib/actions/services';
import { Check, ChevronRight, Copy, Loader2 } from 'lucide-react';

interface Props {
  groups: { id: string; name: string }[];
  owners: { id: string; full_name: string; email: string }[];
  services: { id: string; code: string; name: string; service_categories: { name: string } | null }[];
}

const STEPS = ['Profile', 'Services', 'Team', 'Portal'] as const;

export default function OnboardingWizard({ groups, owners, services }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    business_name: '',
    pan: '',
    gstin: '',
    category: '',
    industry: '',
    primary_contact_person: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    city: '',
    state: '',
    pincode: '',
    lifecycle_stage: 'lead',
    group_id: '',
    primary_owner_id: '',
    notes: '',
  });

  const [serviceIds, setServiceIds] = useState<Set<string>>(new Set());
  const [teamPicks, setTeamPicks] = useState<Array<{ id: string; role: 'lead' | 'support' | 'reviewer' }>>([]);
  const [portalEnabled, setPortalEnabled] = useState(false);

  function setField<K extends keyof typeof profile>(k: K, v: any) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  // GSTIN→state derivation (simple Indian state code map)
  const STATE_BY_CODE: Record<string, string> = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
    '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '19': 'West Bengal', '24': 'Gujarat', '27': 'Maharashtra',
    '29': 'Karnataka', '32': 'Kerala', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh',
  };
  function onGstinChange(v: string) {
    const upper = v.toUpperCase();
    setField('gstin', upper);
    if (upper.length >= 2) {
      const stateName = STATE_BY_CODE[upper.slice(0, 2)];
      if (stateName && !profile.state) setField('state', stateName);
    }
  }

  async function saveProfile(): Promise<boolean> {
    const payload: any = { ...profile };
    if (!payload.group_id) payload.group_id = null;
    if (!payload.primary_owner_id) payload.primary_owner_id = null;
    if (!payload.category) payload.category = null;

    if (clientId) {
      const r = await updateClientAction({ id: clientId, ...payload });
      if (!r.success) { toast.error(r.error); return false; }
      return true;
    }
    const r = await createClientAction(payload);
    if (!r.success) { toast.error(r.error); return false; }
    setClientId((r as any).data.id);
    toast.success('Client created');
    return true;
  }

  async function linkServices(): Promise<boolean> {
    if (!clientId) return false;
    for (const sid of serviceIds) {
      const r = await linkServiceToClientAction({ client_id: clientId, service_id: sid });
      if (!r.success && r.code !== 'DUPLICATE') {
        toast.error(`Service link failed: ${r.error}`);
        return false;
      }
    }
    return true;
  }

  async function linkTeam(): Promise<boolean> {
    if (!clientId) return false;
    for (const t of teamPicks) {
      const r = await assignTeamMemberAction({ clientId, teamUserId: t.id, role: t.role });
      if (!r.success && !/duplicate/i.test(r.error || '')) {
        toast.error(`Team assign failed: ${r.error}`);
        return false;
      }
    }
    return true;
  }

  async function finalizePortal(): Promise<boolean> {
    if (!clientId) return false;
    if (!portalEnabled) return true; // nothing to do
    const r = await updateClientAction({ id: clientId, ...profile, portal_enabled: true } as any);
    if (!r.success) { toast.error(r.error); return false; }
    return true;
  }

  function next() {
    startTransition(async () => {
      if (step === 0) {
        if (!profile.business_name.trim()) { toast.error('Business name is required'); return; }
        if (!(await saveProfile())) return;
      } else if (step === 1) {
        if (!(await linkServices())) return;
      } else if (step === 2) {
        if (!(await linkTeam())) return;
      } else if (step === 3) {
        if (!(await finalizePortal())) return;
      }
      if (step < STEPS.length - 1) setStep(step + 1);
      else router.push(`/admin/clients/${clientId}`);
    });
  }

  return (
    <div className="space-y-8">
      <Stepper current={step} />

      {step === 0 && (
        <ProfileStep profile={profile} setField={setField} onGstinChange={onGstinChange} groups={groups} owners={owners} />
      )}

      {step === 1 && (
        <ServicesStep services={services} selected={serviceIds} setSelected={setServiceIds} />
      )}

      {step === 2 && (
        <TeamStep owners={owners} picks={teamPicks} setPicks={setTeamPicks} />
      )}

      {step === 3 && (
        <PortalStep enabled={portalEnabled} setEnabled={setPortalEnabled} clientId={clientId} email={profile.primary_contact_email} />
      )}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>Back</Button>
        <Button onClick={next} disabled={pending} data-testid="wizard-next">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>
              {step === STEPS.length - 1 ? 'Finish' : 'Continue'} <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-3">
          <div className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs font-medium ${i < current ? 'bg-teal-600 border-teal-600 text-white' : i === current ? 'border-teal-600 text-teal-700' : 'border-zinc-300 text-zinc-400'}`}>
            {i < current ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <span className={i === current ? 'font-semibold text-zinc-900' : 'text-zinc-500'}>{s}</span>
          {i < STEPS.length - 1 && <div className="w-8 h-px bg-zinc-200" />}
        </li>
      ))}
    </ol>
  );
}

function ProfileStep({ profile, setField, onGstinChange, groups, owners }: any) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <h3 className="text-base font-semibold text-zinc-900">Business profile</h3>
      <div className="space-y-2">
        <Label htmlFor="bn">Business name *</Label>
        <Input id="bn" required value={profile.business_name} onChange={(e: any) => setField('business_name', e.target.value)} data-testid="wizard-business-name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>PAN</Label><Input value={profile.pan} onChange={(e: any) => setField('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} /></div>
        <div className="space-y-2"><Label>GSTIN</Label><Input value={profile.gstin} onChange={(e: any) => onGstinChange(e.target.value)} placeholder="33ABCDE1234F1Z5" maxLength={15} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Category</Label>
          <Select value={profile.category} onValueChange={(v: string) => setField('category', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['sole_proprietor', 'partnership', 'llp', 'pvt_ltd', 'public_ltd', 'huf', 'aop', 'ngo', 'other'].map(c => (
                <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Industry</Label><Input value={profile.industry} onChange={(e: any) => setField('industry', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact person</Label><Input value={profile.primary_contact_person} onChange={(e: any) => setField('primary_contact_person', e.target.value)} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={profile.primary_contact_phone} onChange={(e: any) => setField('primary_contact_phone', e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={profile.primary_contact_email} onChange={(e: any) => setField('primary_contact_email', e.target.value)} data-testid="wizard-email" /></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>City</Label><Input value={profile.city} onChange={(e: any) => setField('city', e.target.value)} /></div>
        <div className="space-y-2"><Label>State</Label><Input value={profile.state} onChange={(e: any) => setField('state', e.target.value)} /></div>
        <div className="space-y-2"><Label>Pincode</Label><Input value={profile.pincode} onChange={(e: any) => setField('pincode', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Group</Label>
          <Select value={profile.group_id} onValueChange={(v: string) => setField('group_id', v)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Primary owner</Label>
          <Select value={profile.primary_owner_id} onValueChange={(v: string) => setField('primary_owner_id', v)}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              {owners.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Internal notes</Label><Textarea value={profile.notes} onChange={(e: any) => setField('notes', e.target.value)} rows={2} /></div>
    </div>
  );
}

function ServicesStep({ services, selected, setSelected }: any) {
  function toggle(id: string) {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelected(ns);
  }
  // group by category
  const byCat: Record<string, any[]> = {};
  for (const s of services) {
    const cat = s.service_categories?.name || 'Other';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(s);
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900">Services to engage</h3>
        <Badge variant="outline">{selected.size} selected</Badge>
      </div>
      <p className="text-sm text-zinc-500">You can adjust services later from the client&apos;s Services tab.</p>
      <div className="space-y-4">
        {Object.entries(byCat).map(([cat, arr]) => (
          <div key={cat}>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">{cat}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {arr.map((s: any) => (
                <label key={s.id} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 cursor-pointer">
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} data-testid={`wizard-svc-${s.code}`} />
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">{s.code}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamStep({ owners, picks, setPicks }: any) {
  function setRole(id: string, role: 'lead' | 'support' | 'reviewer' | 'none') {
    if (role === 'none') {
      setPicks(picks.filter((p: any) => p.id !== id));
    } else {
      const existing = picks.find((p: any) => p.id === id);
      if (existing) setPicks(picks.map((p: any) => p.id === id ? { ...p, role } : p));
      else setPicks([...picks, { id, role }]);
    }
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <h3 className="text-base font-semibold text-zinc-900">Engagement team</h3>
      <p className="text-sm text-zinc-500">Pick a lead, support, and (optionally) a reviewer. You can change this anytime.</p>
      <div className="divide-y divide-zinc-100">
        {owners.map((o: any) => {
          const pick = picks.find((p: any) => p.id === o.id);
          return (
            <div key={o.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{o.full_name}</div>
                <div className="text-xs text-zinc-500">{o.email}</div>
              </div>
              <Select value={pick?.role || 'none'} onValueChange={(v: any) => setRole(o.id, v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">none</SelectItem>
                  <SelectItem value="lead">lead</SelectItem>
                  <SelectItem value="support">support</SelectItem>
                  <SelectItem value="reviewer">reviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PortalStep({ enabled, setEnabled, clientId, email }: any) {
  const inviteLink = clientId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?client=${clientId}` : '';
  function copy() {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Client portal access</h3>
          <p className="text-sm text-zinc-500 mt-1">Default modules on first enable: Dashboard, Tasks, Queries. Add more from the Portal tab later.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => setEnabled(!!v)} data-testid="wizard-portal-toggle" />
      </div>
      {enabled && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 space-y-3">
          <div className="text-sm text-zinc-700">
            Invite <strong>{email || 'the client contact'}</strong> via the link below. They will need to register through Supabase Auth and be linked to this client by an admin.
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value={inviteLink} className="font-mono text-xs" />
            <Button onClick={copy} variant="outline" size="icon" aria-label="Copy"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
