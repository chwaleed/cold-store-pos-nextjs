'use client';

import { EntryDetails } from '@/components/entry/entry-details';
import { use } from 'react';

export default function EntryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const entryId = parseInt(id);

  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4">
      <EntryDetails entryId={entryId} />
    </div>
  );
}
