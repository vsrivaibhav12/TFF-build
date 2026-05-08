import { requireRole } from '@/lib/auth/require-role';
import { listLeaveRequests } from '@/lib/repositories/leave';
import LeaveForm from './leave-form';
import ReviewLeave from './review-leave';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const me = await requireRole(['admin', 'team']);
  const [mine, pendingAll] = await Promise.all([
    listLeaveRequests({ userId: me.id }),
    me.role === 'admin' ? listLeaveRequests({ status: 'pending' }) : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Leave</h1><p className="text-zinc-500 mt-1">Request and track time-off.</p></div>
        <LeaveForm />
      </div>

      {me.role === 'admin' && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Pending approvals</h2>
          {pendingAll.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 p-6 bg-zinc-50 text-sm text-zinc-500">No pending requests.</div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Type</TableHead><TableHead>Range</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>{pendingAll.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.users_profile?.full_name}</TableCell>
                    <TableCell><Badge variant="outline">{r.leave_type}</Badge></TableCell>
                    <TableCell className="text-xs">{formatDateIST(r.from_date)} → {formatDateIST(r.to_date)}</TableCell>
                    <TableCell>{r.number_of_days}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.reason ?? '—'}</TableCell>
                    <TableCell><ReviewLeave id={r.id} /></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">My requests</h2>
        {mine.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 p-6 bg-zinc-50 text-sm text-zinc-500">No requests yet.</div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Range</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
              <TableBody>{mine.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{r.leave_type}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDateIST(r.from_date)} → {formatDateIST(r.to_date)}</TableCell>
                  <TableCell>{r.number_of_days}</TableCell>
                  <TableCell><Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-zinc-500">{r.review_remarks ?? '—'}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
