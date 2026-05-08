'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, Users, MessageSquare, Calendar, FileText, Settings, ShieldCheck, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CmdItem {
  id: string;
  label: string;
  href: string;
  group: string;
  icon?: React.ReactNode;
  keywords?: string;
}

const BASE_ITEMS: CmdItem[] = [
  { id: 'go-clients', label: 'Go to clients', href: '/admin/clients', group: 'Navigate', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'go-tasks', label: 'Go to tasks', href: '/team/tasks', group: 'Navigate', icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: 'go-queries', label: 'Go to queries', href: '/team/queries', group: 'Navigate', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: 'go-cal', label: 'Go to compliance calendar', href: '/team/calendar', group: 'Navigate', icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: 'go-docs', label: 'Go to documents', href: '/team/documents', group: 'Navigate', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'go-notices', label: 'Go to notices', href: '/team/notices', group: 'Navigate', icon: <ScrollText className="h-3.5 w-3.5" /> },
  { id: 'go-dsc', label: 'Go to DSC vault', href: '/admin/dsc', group: 'Navigate', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'go-cred', label: 'Go to credentials', href: '/admin/credentials', group: 'Navigate', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'go-payroll', label: 'Go to payroll', href: '/admin/payroll', group: 'Navigate', icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: 'go-audit', label: 'Go to audit trail', href: '/admin/audit', group: 'Navigate', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'new-client', label: 'New client (onboarding wizard)', href: '/admin/clients/new', group: 'Create', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'go-account', label: 'Notification preferences', href: '/account/notifications', group: 'Settings', icon: <Settings className="h-3.5 w-3.5" /> },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<CmdItem[]>(BASE_ITEMS);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // When query changes, fetch dynamic suggestions (clients matching)
  useEffect(() => {
    if (!open || q.length < 2) { setItems(BASE_ITEMS); return; }
    startTransition(async () => {
      try {
        const r = await fetch(`/api/cmdk/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const j = await r.json();
        const dyn: CmdItem[] = (j.clients ?? []).map((c: any) => ({
          id: `client-${c.id}`, label: c.business_name, group: 'Clients', href: `/admin/clients/${c.id}`, icon: <Users className="h-3.5 w-3.5" />,
        }));
        setItems([...BASE_ITEMS, ...dyn]);
      } catch { setItems(BASE_ITEMS); }
    });
  }, [q, open]);

  const ql = q.toLowerCase().trim();
  const filtered = items.filter((i) => !ql || i.label.toLowerCase().includes(ql) || (i.keywords ?? '').toLowerCase().includes(ql));
  const groups = filtered.reduce<Record<string, CmdItem[]>>((acc, i) => { (acc[i.group] = acc[i.group] || []).push(i); return acc; }, {});

  function go(href: string) { setOpen(false); router.push(href); }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-zinc-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} data-testid="cmdk-overlay">
      <div className="w-full max-w-xl mx-4 rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) go(filtered[active].href); }
            }}
            placeholder="Search anything… clients, modules, settings"
            className="flex-1 outline-none text-sm placeholder:text-zinc-400"
            data-testid="cmdk-input"
          />
          <kbd className="text-xs text-zinc-400 font-mono">esc</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groups).length === 0 && <div className="p-8 text-sm text-center text-zinc-500">No matches.</div>}
          {Object.entries(groups).map(([gname, items]) => (
            <div key={gname}>
              <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{gname}</div>
              {items.map((i) => {
                const idx = filtered.indexOf(i);
                return (
                  <button
                    key={i.id}
                    onClick={() => go(i.href)}
                    onMouseEnter={() => setActive(idx)}
                    className={cn('w-full flex items-center gap-2 px-4 py-2 text-sm text-left', idx === active ? 'bg-teal-50 text-teal-900' : 'hover:bg-zinc-50')}
                    data-testid={`cmdk-item-${i.id}`}
                  >
                    {i.icon}
                    <span className="flex-1">{i.label}</span>
                    <span className="text-[10px] text-zinc-400">{i.href}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-zinc-100 text-[10px] text-zinc-400 flex items-center justify-between">
          <span>↑↓ navigate · ↵ open · esc close</span>
          {pending && <span>Loading…</span>}
        </div>
      </div>
    </div>
  );
}
