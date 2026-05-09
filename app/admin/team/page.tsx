import Link from 'next/link';
import { listTeamUsers } from '@/lib/repositories/clients';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const team = await listTeamUsers();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-zinc-500 mt-1">
            Internal users with admin or team role. New users are created via
            Supabase Auth dashboard for now.
          </p>
        </div>
        <Button variant="outline" asChild data-testid="manage-roles-btn">
          <Link href="/admin/team/roles">
            <ShieldCheck className="h-4 w-4" /> Role templates
          </Link>
        </Button>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((u: any) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-zinc-50">
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/team/${u.id}`}
                    className="hover:underline"
                    data-testid={`team-row-${u.id}`}
                  >
                    {u.full_name}
                  </Link>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'admin' ? 'teal' : 'outline'}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="warning">Inactive</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
