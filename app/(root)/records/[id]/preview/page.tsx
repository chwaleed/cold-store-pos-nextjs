'use client';

import { EntryReceiptPreview } from '@/components/entry/entry-receipt-preview';

export default function EntryPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const entryId = parseInt(params.id);

  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4">
      <EntryReceiptPreview entryId={entryId} />
    </div>
  );
}
