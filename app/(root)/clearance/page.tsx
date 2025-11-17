import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { ClearanceTable } from '../../../components/clearance/clearance-table';

export default function ClearancePage() {
  return (
    <div className=" w-full h-full bg-background rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clearance</h1>
          <p className="text-muted-foreground">
            Manage inventory clearance and calculate rent
          </p>
        </div>
        <Button asChild>
          <Link href="/clearance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Clearance
          </Link>
        </Button>
      </div>

      <ClearanceTable />
    </div>
  );
}
