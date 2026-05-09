import Link from 'next/link';
import {
  ShieldCheck, Wallet, Building2, Calendar, FolderTree, Settings as SettingsIcon, KeyRound, FileText,
} from 'lucide-react';

interface SettingCard {
  href: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  testid: string;
}

const CARDS: SettingCard[] = [
  { href: '/admin/team/roles', title: 'Staff role templates', body: 'Group capabilities into roles like Senior Tax Associate. Apply to team members in one click.', icon: ShieldCheck, testid: 'set-roles' },
  { href: '/admin/settings/billing-entities', title: 'Billing entities', body: 'TFF LLP, your existing CA practice — manage GSTIN, invoice prefix, signing authority, bank details.', icon: Wallet, testid: 'set-billing-entities' },
  { href: '/admin/settings/profit-cost-centres', title: 'Profit & cost centres', body: 'Two-character codes used to slice tasks, work-done, and reports by pillar (CaaS / BizLens / vCFO).', icon: FolderTree, testid: 'set-pc-cc' },
  { href: '/admin/settings/compliance-rules', title: 'Compliance calendar rules', body: 'Edit the statutory due-date master. Add, disable, or change reminder windows.', icon: Calendar, testid: 'set-rules' },
  { href: '/admin/services', title: 'Service catalogue', body: 'Define services, sub-services, SOP steps, document-request templates.', icon: SettingsIcon, testid: 'set-catalogue' },
  { href: '/admin/team', title: 'Team', body: 'Invite, deactivate, or change role for staff. Tied to billing-entity access.', icon: Building2, testid: 'set-team' },
  { href: '/admin/credentials', title: 'Credentials vault', body: 'Encrypted store for client portal logins. Audited reveals.', icon: KeyRound, testid: 'set-credentials' },
  { href: '/admin/audit', title: 'Audit trail', body: 'Every change to data is recorded. Filter by entity, user, timeframe.', icon: FileText, testid: 'set-audit' },
];

export default function AdminSettingsHub() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-1">
          Firm-wide configuration. Most things you change here apply to every staff member and every client.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              data-testid={c.testid}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-teal-300 hover:bg-teal-50/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 group-hover:border-teal-200 group-hover:bg-white">
                  <Icon className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{c.title}</div>
                  <p className="text-sm text-zinc-600 mt-1">{c.body}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
