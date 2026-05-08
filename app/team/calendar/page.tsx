import { listAllUpcomingDueDates } from '@/lib/repositories/compliance';
import { listAllNotices, listHearings } from '@/lib/repositories/notices';
import { listExpiringDsc } from '@/lib/repositories/dsc';
import ComplianceCalendar from './calendar';

export const dynamic = 'force-dynamic';

export default async function TeamCalendarPage() {
  const [agg, notices, hearings, dsc] = await Promise.all([
    listAllUpcomingDueDates(120),
    listAllNotices(),
    listHearings(),
    listExpiringDsc(120),
  ]);
  // Flatten all into a unified event shape
  const events: Array<{ date: string; type: string; label: string; clientName: string; href?: string; severity: 'info' | 'warning' | 'danger' }> = [];
  for (const f of agg.gst as any[]) events.push({ date: f.due_date, type: 'GST', label: `${f.return_type} ${f.period_month}/${f.period_year}`, clientName: f.clients?.business_name ?? '', href: `/team/clients/${f.client_id}`, severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const f of agg.tds as any[]) events.push({ date: f.due_date, type: 'TDS', label: `Q${f.period_quarter} ${f.period_year}`, clientName: f.clients?.business_name ?? '', href: `/team/clients/${f.client_id}`, severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const f of agg.it as any[]) events.push({ date: f.due_date, type: 'IT', label: `FY ${f.fy_ending_year}`, clientName: f.clients?.business_name ?? '', href: `/team/clients/${f.client_id}`, severity: f.status === 'filed' ? 'info' : 'warning' });
  for (const n of notices as any[]) if (n.due_date) events.push({ date: n.due_date, type: 'Notice', label: n.subject ?? n.notice_number ?? n.notice_type, clientName: n.clients?.business_name ?? '', severity: n.status === 'closed' ? 'info' : 'warning' });
  for (const h of hearings as any[]) if (h.hearing_scheduled_date) events.push({ date: h.hearing_scheduled_date, type: 'Hearing', label: h.subject ?? h.hearing_type ?? 'Hearing', clientName: h.clients?.business_name ?? '', severity: 'warning' });
  for (const d of dsc as any[]) events.push({ date: d.expiry_date, type: 'DSC', label: `${d.holder_name} expires`, clientName: d.clients?.business_name ?? '', severity: 'danger' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance calendar</h1>
        <p className="text-zinc-500 mt-1">All filings, notices, hearings and DSC expiries on a single grid.</p>
      </div>
      <ComplianceCalendar events={events} />
    </div>
  );
}
