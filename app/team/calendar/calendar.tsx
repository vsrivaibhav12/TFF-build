'use client';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  date: string;
  type: string;
  label: string;
  clientName: string;
  href?: string;
  severity: 'info' | 'warning' | 'danger';
}

export default function ComplianceCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!e.date) continue;
      const d = e.date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [events]);

  const monthStart = new Date(cursor.year, cursor.month, 1);
  const monthEnd = new Date(cursor.year, cursor.month + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  // 6 weeks * 7 days grid
  const cells: Array<{ date: Date | null; iso: string }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ date: null, iso: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(cursor.year, cursor.month, d);
    cells.push({ date, iso: date.toISOString().slice(0, 10) });
  }
  while (cells.length < 42) cells.push({ date: null, iso: '' });

  const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const sevColor = { info: 'bg-zinc-300', warning: 'bg-amber-500', danger: 'bg-red-500' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <button onClick={() => setCursor((c) => ({ year: c.month === 0 ? c.year - 1 : c.year, month: c.month === 0 ? 11 : c.month - 1 }))} className="p-1 hover:bg-zinc-100 rounded"><ChevronLeft className="h-4 w-4" /></button>
          <div className="font-semibold">{monthLabel}</div>
          <button onClick={() => setCursor((c) => ({ year: c.month === 11 ? c.year + 1 : c.year, month: c.month === 11 ? 0 : c.month + 1 }))} className="p-1 hover:bg-zinc-100 rounded"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 text-xs font-medium text-zinc-500 border-b border-zinc-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const evts = c.iso ? eventsByDate[c.iso] ?? [] : [];
            const isToday = c.iso === today.toISOString().slice(0, 10);
            const isSelected = c.iso && c.iso === selected;
            return (
              <button
                key={i}
                onClick={() => c.iso && setSelected(c.iso)}
                className={cn('aspect-square border-t border-l border-zinc-100 p-2 text-left flex flex-col gap-1 hover:bg-zinc-50', !c.date && 'bg-zinc-50/50 cursor-default', isSelected && 'bg-teal-50 ring-1 ring-teal-300')}
                disabled={!c.date}
                data-testid={c.iso ? `cal-day-${c.iso}` : undefined}
              >
                {c.date && (
                  <>
                    <span className={cn('text-xs font-medium', isToday && 'text-teal-700')}>{c.date.getDate()}</span>
                    <div className="flex gap-0.5 flex-wrap">
                      {evts.slice(0, 4).map((e, ei) => (
                        <span key={ei} className={cn('h-1.5 w-1.5 rounded-full', sevColor[e.severity])} />
                      ))}
                      {evts.length > 4 && <span className="text-[10px] text-zinc-500">+{evts.length - 4}</span>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold mb-3">{selected ? `Events on ${selected}` : 'Select a date'}</div>
        {selected && (eventsByDate[selected] ?? []).length === 0 && (
          <div className="text-sm text-zinc-500">Nothing scheduled on this date.</div>
        )}
        {selected && (eventsByDate[selected] ?? []).map((e, i) => (
          <div key={i} className="py-2 border-b border-zinc-100 last:border-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{e.type}</Badge>
              <span className="text-xs text-zinc-500">{e.clientName}</span>
            </div>
            <div className="text-sm mt-1">{e.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
