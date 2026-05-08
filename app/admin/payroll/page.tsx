import Link from 'next/link';
import { listPayrollRuns } from '@/lib/repositories/payroll';
import { listTeamUsers } from '@/lib/repositories/clients';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PayrollRunForm from './run-form';
import { formatCurrencyINR, formatDateIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const [runs, team] = await Promise.all([listPayrollRuns(), listTeamUsers()]);
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-zinc-500 mt-1">Monthly payroll runs computed from attendance + per-user settings.</p>
        </div>
        <PayrollRunForm team={team as any} />
      </div>
      {runs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50 text-sm text-zinc-500">No payroll runs yet. Configure salary settings then run one for the month.</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Period</TableHead><TableHead>Present / Leave</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{runs.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-zinc-50" data-testid={`payroll-row-${r.id}`}>
                <TableCell className="font-medium"><Link href={`/admin/payroll/${r.id}`} className="hover:underline">{r.users_profile?.full_name}</Link></TableCell>
                <TableCell>{r.month}/{r.year}</TableCell>
                <TableCell className="text-xs">{r.actual_present_days ?? '—'}d / {r.actual_leave_days ?? '—'}d</TableCell>
                <TableCell className="tabular-nums">{formatCurrencyINR(r.gross_salary)}</TableCell>
                <TableCell className="tabular-nums">{formatCurrencyINR(r.total_deductions)}</TableCell>
                <TableCell className="tabular-nums font-semibold">{formatCurrencyINR(r.final_salary)}</TableCell>
                <TableCell><Badge variant={r.status === 'paid' ? 'success' : 'outline'}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
