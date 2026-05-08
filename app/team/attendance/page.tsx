import { requireRole } from '@/lib/auth/require-role';
import { listAttendanceForUser, getTodayAttendance } from '@/lib/repositories/attendance';
import CheckInOut from './check-in-out';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const me = await requireRole(['admin', 'team']);
  const now = new Date();
  const [today, monthLogs] = await Promise.all([
    getTodayAttendance(me.id),
    listAttendanceForUser(me.id, now.getFullYear(), now.getMonth() + 1),
  ]);
  const present = monthLogs.filter((l: any) => l.status === 'present' || l.status === 'work_from_home').length;
  const onLeave = monthLogs.filter((l: any) => l.status === 'leave').length;
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My attendance</h1>
          <p className="text-zinc-500 mt-1">Today, this month, and historical logs.</p>
        </div>
        <CheckInOut today={today as any} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Present this month" value={`${present}d`} />
        <Metric label="On leave this month" value={`${onLeave}d`} />
        <Metric label="Today" value={today ? ((today as any).status ?? 'present') : 'not checked in'} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead></TableRow></TableHeader>
          <TableBody>{monthLogs.map((l: any) => (
            <TableRow key={l.id}>
              <TableCell>{formatDateIST(l.attendance_date)}</TableCell>
              <TableCell><Badge variant={l.status === 'leave' ? 'warning' : 'success'}>{l.status}</Badge></TableCell>
              <TableCell className="text-xs">{l.check_in_time ? new Date(l.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
              <TableCell className="text-xs">{l.check_out_time ? new Date(l.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-zinc-200 p-6 bg-white"><div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div><div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div></div>;
}
