'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { ClearanceReceipt } from '@/types/clearance';
import { ClearnceReceiptPreview } from '@/components/clearance/clearance-recipt-preview';

export default function ClearanceDetailsPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-xl p-6 space-y-6">
      <ClearnceReceiptPreview clearanceId={params.id} />
    </div>
  );
}
