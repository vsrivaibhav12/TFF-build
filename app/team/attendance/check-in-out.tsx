'use client';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { checkInAction, checkOutAction } from '@/lib/actions/attendance';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

export default function CheckInOut({ today }: { today: any }) {
  const [pending, startTransition] = useTransition();
  function checkIn() {
    startTransition(async () => {
      const r = await checkInAction();
      if (r.success) toast.success('Checked in');
      else toast.error(r.error);
    });
  }
  function checkOut() {
    startTransition(async () => {
      const r = await checkOutAction();
      if (r.success) toast.success('Checked out');
      else toast.error(r.error);
    });
  }
  return (
    <div className="flex items-center gap-2">
      {!today?.check_in_time && <Button onClick={checkIn} disabled={pending} data-testid="attendance-checkin"><Clock className="h-4 w-4" /> Check in</Button>}
      {today?.check_in_time && !today?.check_out_time && <Button onClick={checkOut} disabled={pending} variant="outline" data-testid="attendance-checkout"><Clock className="h-4 w-4" /> Check out</Button>}
      {today?.check_out_time && <span className="text-sm text-zinc-500">Checked out</span>}
    </div>
  );
}
