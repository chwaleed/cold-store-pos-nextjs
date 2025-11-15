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

interface ClearnceReceiptPreviewProps {
  clearanceId: number;
}

export function ClearnceReceiptPreview({
  clearanceId,
}: ClearnceReceiptPreviewProps) {
  const [clearnceItem, setClearancesItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clearance/${clearanceId}`);
        const result = await response.json();

        if (result.success) {
          setClearancesItem(result.data);
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
  }, [clearanceId, toast]);

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

  if (!clearnceItem) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Entry receipt not found</p>
      </div>
    );
  }

  // Prepare data for the DataTable
  const itemsData = clearnceItem.clearedItems?.map((item, index) => ({
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
            {row.entryItem?.productType?.name || 'N/A'}
          </p>
          {row.entryItem?.productSubType && (
            <p className="text-xs text-muted-foreground leading-tight">
              {row.entryItem?.productSubType.name}
            </p>
          )}
        </div>
      ),
      id: 'product',
    },
    {
      name: 'Pack',
      accessor: (row: any) => (
        <span className="text-sm">
          {row.entryItem?.packType?.name || 'N/A'}
        </span>
      ),
      id: 'packType',
    },
    {
      name: 'Room/Box',
      accessor: (row: any) => (
        <div className=" items-center gap-1.5">
          <p className="text-sm">{row.entryItem?.room?.name || 'N/A'}</p>

          <p className="text-xs text-muted-foreground leading-tight">
            Box: {row.entryItem?.boxNo}
          </p>
        </div>
      ),
      id: 'room',
    },
    {
      name: 'Marka',
      accessor: (row: any) => (
        <div className="text-xs leading-tight">
          {row.entryItem?.marka && <p> {row.entryItem?.marka}</p>}
          {!row.entryItem?.marka && <p>-</p>}
        </div>
      ),
      id: 'boxMarka',
    },
    {
      name: 'Entry Recipt/Car No',
      accessor: (row: any) => (
        <div className="py-1">
          <p className="font-medium text-sm leading-tight">
            {row.entryItem?.entryReceipt?.receiptNo || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            Car No: {row.entryItem?.entryReceipt?.carNo}
          </p>
        </div>
      ),
      id: 'entryRecipt',
    },
    {
      name: 'Price',
      accessor: (row: any) => (
        <div className="text-xs leading-tight">
          <p>
            {row.clearQuantity} × {row.entryItem?.unitPrice?.toFixed(2)}{' '}
          </p>
          <p className="text-muted-foreground">
            = {(row.clearQuantity * row.entryItem?.unitPrice).toFixed(2)}
          </p>
        </div>
      ),
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    // <span className="text-sm">{row.unitPrice.toFixed(2)}</span>

    {
      name: 'KJ',
      accessor: (row: any) => {
        if (row.clearKjQuantity) {
          return (
            <div className="text-xs leading-tight">
              <p>
                {row.clearKjQuantity} × {row.entryItem?.kjUnitPrice?.toFixed(2)}{' '}
              </p>
              <p className="text-muted-foreground">
                = {row.clearKjQuantity * row.entryItem?.kjUnitPrice?.toFixed(2)}
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
        return (
          <span className="text-sm font-semibold">
            {row.totalAmount?.toFixed(2)}
          </span>
        );
      },
      id: 'total',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    // {
    //   name: 'Rem',
    //   accessor: (row: any) => (
    //     <Badge
    //       variant={row.remainingQuantity === 0 ? 'outline' : 'default'}
    //       className="text-xs px-1.5 py-0 h-5"
    //     >
    //       {row.remainingQuantity}
    //     </Badge>
    //   ),
    //   id: 'remaining',
    //   className: 'text-right',
    //   headerClassName: 'text-right',
    // },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/clearance')}
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
              Receipt: {clearnceItem.clearanceNo}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatDate(clearnceItem.clearanceDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">{clearnceItem.customer.name}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Car Number</p>
            <p className="font-medium">{clearnceItem.carNo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="font-medium">{clearnceItem.clearedItems?.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-medium">
              PKR {clearnceItem.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {clearnceItem.customer.phone && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="font-medium">{clearnceItem.customer.phone}</p>
          </div>
        )}

        {clearnceItem.description && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="font-medium">{clearnceItem.description}</p>
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
            Grand Total: PKR {clearnceItem.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
