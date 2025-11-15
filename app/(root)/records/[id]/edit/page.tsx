'use client';

import { EntryEditForm } from '@/components/entry/entry-edit-form';

export default function EntryEditPage({ params }: { params: { id: string } }) {
  const entryId = parseInt(params.id);

  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Entry Receipt</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update entry receipt details and item information
        </p>
      </div>
      <EntryEditForm entryId={entryId} />
    </div>
  );
}
