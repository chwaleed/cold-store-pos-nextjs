'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerWithBalance } from '@/types/customer';
import { LedgerWithReceipt } from '@/types/ledger';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddDirectCashDialog } from './add-direct-cash-dialog';
import { DeleteLedgerDialog } from './delete-ledger-dialog';
import DataTable from '@/components/dataTable/data-table';

interface ViewCustomerDialogProps {
  customerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCustomerDialog({
  customerId,
  open,
  onOpenChange,
}: ViewCustomerDialogProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerWithReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCash, setShowAddCash] = useState(false);
  const [showDeleteLedger, setShowDeleteLedger] = useState(false);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<LedgerWithReceipt | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      const [customerRes, ledgerRes] = await Promise.all([
        fetch(`/api/customer/${customerId}`),
        fetch(`/api/ledger?customerId=${customerId}&${params.toString()}`),
      ]);

      const customerData = await customerRes.json();
      const ledgerData = await ledgerRes.json();

      if (customerData.success) {
        setCustomer(customerData.data);
      }
      if (ledgerData.success) {
        setLedgerEntries(ledgerData.data);
        setTotalPages(ledgerData.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      setPage(1); // Reset to first page when dialog opens
      fetchData();
    }
  }, [customerId, open]);

  useEffect(() => {
    if (open && customerId) {
      fetchData();
    }
  }, [page]);

  const handleDeleteLedger = (entry: LedgerWithReceipt) => {
    setSelectedLedgerEntry(entry);
    setShowDeleteLedger(true);
  };

  const handleViewReceipt = (entry: LedgerWithReceipt) => {
    if (entry.type === 'adding_inventory' && entry.entryReceiptId) {
      router.push(`/records/${entry.entryReceiptId}`);
      onOpenChange(false);
    } else if (entry.type === 'clearance' && entry.clearanceReceiptId) {
      router.push(`/clearance/${entry.clearanceReceiptId}`);
      onOpenChange(false);
    }
  };

  const getLedgerTypeBadge = (type: string) => {
    switch (type) {
      case 'adding_inventory':
        return <Badge variant="default">Inventory Added</Badge>;
      case 'clearance':
        return <Badge variant="secondary">Clearance</Badge>;
      case 'direct_cash':
        return <Badge variant="outline">Direct Cash</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const columns = [
    {
      name: 'Date',
      accessor: (row: any) => new Date(row.createdAt).toLocaleDateString(),
      id: 'date',
    },
    {
      name: 'Type',
      accessor: (row: any) => getLedgerTypeBadge(row.type),
      id: 'type',
    },
    {
      name: 'Receipt No',
      accessor: (row: any) =>
        row.entryReceipt?.receiptNo || row.clearanceReceipt?.clearanceNo || '-',
      id: 'receiptNo',
    },
    {
      name: 'Description',
      accessor: 'description',
      id: 'description',
    },
    {
      name: 'Debit',
      accessor: (row: any) =>
        row.debitAmount > 0 ? `PKR ${row.debitAmount.toFixed(2)}` : '-',
      id: 'debit',
      className: 'text-right',
    },
    {
      name: 'Credit',
      accessor: (row: any) =>
        row.creditAmount > 0 ? `PKR ${row.creditAmount.toFixed(2)}` : '-',
      id: 'credit',
      className: 'text-right',
    },
    {
      name: 'Balance',
      accessor: (row: any) => `PKR ${row.balance?.toFixed(2) || '0.00'}`,
      id: 'balance',
      className: 'text-right font-medium',
    },
    {
      name: 'Action',
      accessor: (row: any) => {
        const isSystemGenerated = row.entryReceiptId || row.clearanceReceiptId;
        
        return (
          <div className="flex items-center gap-1">
            {(row.type === 'adding_inventory' || row.type === 'clearance') && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleViewReceipt(row)}
                className="h-8 w-8"
                title="View Receipt"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            {/* Show delete button for direct cash entries only */}
            {row.type === 'direct_cash' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDeleteLedger(row)}
                className="h-8 w-8 text-destructive hover:text-destructive"
                title={isSystemGenerated ? "Cannot delete system-generated entry" : "Delete Entry"}
                disabled={isSystemGenerated}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      id: 'action',
      className: 'text-center',
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details & Ledger</DialogTitle>
          </DialogHeader>

          {loading && !customer ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Father Name</p>
                  <p className="font-medium">{customer.fatherName || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Village</p>
                  <p className="font-medium">{customer.village || '-'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address || '-'}</p>
                </div>
              </div>

              <Separator />

              {/* Account Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Account Balance
                  </p>
                  <p className="text-2xl font-bold">
                    PKR {customer.balance?.toFixed(2) || '0.00'}
                  </p>
                  {customer.balance && customer.balance > 0 && (
                    <Badge variant="destructive">Outstanding</Badge>
                  )}
                  {customer.balance && customer.balance < 0 && (
                    <Badge variant="default">Credit</Badge>
                  )}
                  {(!customer.balance || customer.balance === 0) && (
                    <Badge variant="secondary">Clear</Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Entry Receipts
                  </p>
                  <p className="text-2xl font-bold">
                    {customer._count?.entryReceipts || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Clearance Receipts
                  </p>
                  <p className="text-2xl font-bold">
                    {customer._count?.clearanceReceipts || 0}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Ledger Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Ledger Entries</h3>
                  <Button size="sm" onClick={() => setShowAddCash(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cash Entry
                  </Button>
                </div>

                <DataTable
                  columns={columns}
                  data={ledgerEntries}
                  loading={loading}
                  emptyMessage="No ledger entries found"
                  skeletonRows={5}
                  currentPage={page}
                  lastPage={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Customer not found
            </p>
          )}
        </DialogContent>
      </Dialog>

      {customer && (
        <>
          <AddDirectCashDialog
            customerId={customer.id}
            customerName={customer.name}
            open={showAddCash}
            onOpenChange={setShowAddCash}
            onSuccess={fetchData}
          />
          
          <DeleteLedgerDialog
            ledgerEntry={selectedLedgerEntry}
            open={showDeleteLedger}
            onOpenChange={setShowDeleteLedger}
            onSuccess={fetchData}
          />
        </>
      )}
    </>
  );
}
