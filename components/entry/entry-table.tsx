'use client';

import { useState } from 'react';
import { Eye, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { EntryReceipt } from '@/types/entry';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/dataTable/data-table';

interface EntryTableProps {
  entries: EntryReceipt[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function EntryTable({
  entries,
  loading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
}: EntryTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/entry/${deleteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Entry receipt deleted successfully',
        });
        onRefresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete entry receipt',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete entry receipt',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      name: 'Receipt No',
      accessor: 'receiptNo',
      id: 'receiptNo',
      className: 'font-medium',
    },
    {
      name: 'Customer',
      accessor: (row: EntryReceipt) => row.customer?.name || 'N/A',
      id: 'customer',
    },
    {
      name: 'Car No',
      accessor: 'carNo',
      id: 'carNo',
    },
    {
      name: 'Entry Date',
      accessor: (row: EntryReceipt) => formatDate(row.entryDate),
      id: 'entryDate',
    },
    {
      name: 'Items',
      accessor: (row: EntryReceipt) => (
        <Badge variant="secondary">{row._count?.items || 0} items</Badge>
      ),
      id: 'items',
    },
    {
      name: 'Total Amount',
      accessor: (row: EntryReceipt) => `PKR ${row.totalAmount.toFixed(2)}`,
      id: 'totalAmount',
      className: 'text-right font-medium',
      headerClassName: 'text-right',
    },
    {
      name: 'Actions',
      accessor: (row: EntryReceipt) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/records/${row.id}/preview`)}
            title="Preview Receipt"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/records/${row.id}/edit`)}
            title="Edit Receipt"
            disabled={!!row._count?.clearanceReceipts}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.id)}
            disabled={!!row._count?.clearanceReceipts}
            title={
              row._count?.clearanceReceipts
                ? 'Cannot delete cleared receipt'
                : 'Delete Receipt'
            }
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      id: 'actions',
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No entry receipts found"
        skeletonRows={5}
        currentPage={page}
        lastPage={totalPages}
        onPageChange={onPageChange}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry receipt? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
