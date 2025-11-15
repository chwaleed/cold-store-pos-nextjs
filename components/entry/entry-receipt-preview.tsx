'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/dataTable/data-table';
import { useToast } from '@/components/ui/use-toast';
import { EntryReceiptWithDetails } from '@/types/entry';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface EntryReceiptPreviewProps {
  entryId: number;
}

export function EntryReceiptPreview({ entryId }: EntryReceiptPreviewProps) {
  const [entry, setEntry] = useState<EntryReceiptWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/entry/${entryId}`);
        const result = await response.json();

        if (result.success) {
          setEntry(result.data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entry details',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch entry details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId, toast]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Entry receipt not found</p>
      </div>
    );
  }

  // Prepare data for the DataTable
  const itemsData = entry.items.map((item, index) => ({
    ...item,
    index: index + 1,
  }));

  const columns = [
    {
      name: '#',
      accessor: 'index',
      id: 'index',
      className: 'w-10 py-2',
    },
    {
      name: 'Product',
      accessor: (row: any) => (
        <div className="py-1">
          <p className="font-medium text-sm leading-tight">
            {row.productType?.name || 'N/A'}
          </p>
          {row.productSubType && (
            <p className="text-xs text-muted-foreground leading-tight">
              {row.productSubType.name}
            </p>
          )}
        </div>
      ),
      id: 'product',
    },
    {
      name: 'Pack',
      accessor: (row: any) => (
        <span className="text-sm">{row.packType?.name || 'N/A'}</span>
      ),
      id: 'packType',
    },
    {
      name: 'Room',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{row.room?.name || 'N/A'}</span>
          {row.room?.type && (
            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
              {row.room.type}
            </Badge>
          )}
        </div>
      ),
      id: 'room',
    },
    {
      name: 'Box/Marka',
      accessor: (row: any) => (
        <div className="text-xs leading-tight">
          {row.boxNo && <p>B: {row.boxNo}</p>}
          {row.marka && <p>M: {row.marka}</p>}
          {!row.boxNo && !row.marka && <p>-</p>}
        </div>
      ),
      id: 'boxMarka',
    },
    {
      name: 'Qty',
      accessor: 'quantity',
      id: 'quantity',
      className: 'text-right text-sm py-2',
      headerClassName: 'text-right',
    },
    {
      name: 'Unit Price',
      accessor: (row: any) => (
        <span className="text-sm">{row.unitPrice.toFixed(2)}</span>
      ),
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'KJ',
      accessor: (row: any) => {
        if (row.hasKhaliJali && row.kjQuantity) {
          return (
            <div className="text-xs leading-tight">
              <p>
                {row.kjQuantity} × {row.kjUnitPrice?.toFixed(2)}
              </p>
              <p className="text-muted-foreground">
                = {row.kjTotal?.toFixed(2)}
              </p>
            </div>
          );
        }
        return <span className="text-sm">-</span>;
      },
      id: 'kj',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Total',
      accessor: (row: any) => {
        const total = row.hasKhaliJali ? row.grandTotal : row.totalPrice;
        return (
          <span className="text-sm font-semibold">{total.toFixed(2)}</span>
        );
      },
      id: 'total',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Rem',
      accessor: (row: any) => (
        <Badge
          variant={row.remainingQuantity === 0 ? 'outline' : 'default'}
          className="text-xs px-1.5 py-0 h-5"
        >
          {row.remainingQuantity}
        </Badge>
      ),
      id: 'remaining',
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/records')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="mr-1.5 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Receipt Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Receipt: {entry.receiptNo}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatDate(entry.entryDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">{entry.customer.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Car Number</p>
            <p className="font-medium">{entry.carNo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="font-medium">{entry.items.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-medium">PKR {entry.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {entry.customer.phone && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="font-medium">{entry.customer.phone}</p>
          </div>
        )}

        {entry.description && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="font-medium">{entry.description}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <DataTable
        columns={columns}
        data={itemsData}
        loading={false}
        emptyMessage="No items found"
      />

      <Separator className="my-2" />

      <div className="flex justify-end py-2">
        <div className="text-right">
          <p className="text-lg font-bold">
            Grand Total: PKR {entry.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
