import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClearanceForm } from '@/components/clearance/clearance-form';

export default function NewClearancePage() {
  return (
    <div className=" w-full h-full bg-background rounded-2xl   p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Clearance</h1>
          <p className="text-muted-foreground">
            Process clearance and calculate storage rent
          </p>
        </div>
      </div>

      <ClearanceForm />
    </div>
  );
}
