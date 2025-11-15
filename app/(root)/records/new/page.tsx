'use client';

import { EntryForm } from '@/components/entry/entry-form';
import { Separator } from '@radix-ui/react-separator';

export default function NewEntryPage() {
  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Entry Receipt</h1>
        <p className="text-muted-foreground">
          Create a new inventory entry receipt
        </p>
      </div>

      <EntryForm />
    </div>
  );
}
