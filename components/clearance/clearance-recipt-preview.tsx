'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/dataTable/data-table';
import { useToast } from '@/components/ui/use-toast';
import { EntryReceiptWithDetails } from '@/types/entry';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClearnceReceiptPreviewProps {
  clearanceId: number;
}

export function ClearnceReceiptPreview({
  clearanceId,
}: ClearnceReceiptPreviewProps) {
  const [clearnceItem, setClearancesItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDownloadUrduReceipt = async () => {
    try {
      const response = await fetch(
        `/api/clearance/${clearanceId}/urdu-receipt`
      );

      if (!response.ok) {
        toast({
          title: 'Error',
          description: 'Failed to generate Urdu receipt',
          variant: 'destructive',
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clearance-receipt-${clearnceItem?.clearanceNo}-urdu.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Urdu receipt downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download Urdu receipt',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/clearance/${clearanceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description:
            'Clearance receipt deleted successfully. All related data has been reverted.',
        });
        router.push('/clearance');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete clearance receipt',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete clearance receipt',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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
  const itemsData = clearnceItem.clearedItems?.map(
    (item: any, index: number) => ({
      ...item,
      index: index + 1,
    })
  );

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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadUrduReceipt}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            Urdu Receipt
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
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

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
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
          {clearnceItem.creditAmount > 0 && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">Credit Amount</p>
              <p className="font-medium">
                PKR {clearnceItem.creditAmount.toFixed(2)}
              </p>
            </div>
          )}

          {clearnceItem.discount > 0 && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">Discount</p>
              <p className="font-medium text-green-600">
                PKR {clearnceItem.discount.toFixed(2)}
              </p>
            </div>
          )}

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
        <div className="text-right space-y-1">
          {/* Calculate subtotal (total before discount) */}
          {clearnceItem.discount > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Subtotal: PKR{' '}
                {(clearnceItem.totalAmount + clearnceItem.discount).toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                Discount: -PKR {clearnceItem.discount.toFixed(2)}
              </p>
              <Separator className="my-1" />
            </>
          ) : null}
          <p className="text-lg font-bold">
            Grand Total: PKR {clearnceItem.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clearance Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete clearance receipt{' '}
              <strong>{clearnceItem?.clearanceNo}</strong> and revert all
              related changes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Stock quantities will be restored to entry items</li>
                <li>All ledger entries will be removed</li>
                <li>Cash book entries will be deleted</li>
                <li>Daily cash summary will be recalculated</li>
              </ul>
              <p className="mt-2 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
