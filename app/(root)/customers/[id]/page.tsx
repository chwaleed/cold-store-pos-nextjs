'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Eye, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerWithBalance } from '@/types/customer';
import { LedgerWithReceipt } from '@/types/ledger';
import { Badge } from '@/components/ui/badge';
import { AddDirectCashDialog } from '@/components/customer/add-direct-cash-dialog';
import { EditCustomerDialog } from '@/components/customer/edit-customer-dialog';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/dataTable/data-table';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id ? parseInt(params.id as string) : null;
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerWithReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCash, setShowAddCash] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    if (!customerId) return;

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
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch customer details',
          variant: 'destructive',
        });
      }

      if (ledgerData.success) {
        setLedgerEntries(ledgerData.data);
        setTotalPages(ledgerData.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      setPage(1);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleViewReceipt = (entry: LedgerWithReceipt) => {
    if (entry.type === 'adding_inventory' && entry.entryReceiptId) {
      router.push(`/records/${entry.entryReceipt?.id}/preview`);
    } else if (entry.type === 'clearance' && entry.clearanceReceiptId) {
      router.push(`/clearance/${entry.clearanceReceiptId}`);
    }
  };

  const getLedgerTypeBadge = (type: string) => {
    switch (type) {
      case 'adding_inventory':
        return <Badge variant="default">Inventory</Badge>;
      case 'clearance':
        return <Badge variant="secondary">Clearance</Badge>;
      case 'direct_cash':
        return <Badge variant="outline">Cash</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const ledgerColumns = [
    {
      name: 'Date',
      accessor: (row: any) =>
        new Date(row.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        }),
      id: 'date',
    },
    {
      name: 'Type',
      accessor: (row: any) => getLedgerTypeBadge(row.type),
      id: 'type',
    },
    {
      name: 'Receipt',
      accessor: (row: any) =>
        row.entryReceipt?.receiptNo || row.clearanceReceipt?.clearanceNo || '-',
      id: 'receipt',
      className: 'font-mono text-sm',
    },
    {
      name: 'Description',
      accessor: 'description',
      id: 'description',
    },
    {
      name: 'Debit',
      accessor: (row: any) =>
        row.debitAmount > 0 ? (
          <span className="text-red-600 font-medium">
            {row.debitAmount.toFixed(2)}
          </span>
        ) : (
          '-'
        ),
      id: 'debit',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Credit',
      accessor: (row: any) =>
        row.creditAmount > 0 ? (
          <span className="text-green-600 font-medium">
            {row.creditAmount.toFixed(2)}
          </span>
        ) : (
          '-'
        ),
      id: 'credit',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Balance',
      accessor: (row: any) => row.balance?.toFixed(2) || '0.00',
      id: 'balance',
      className: 'text-right font-bold',
      headerClassName: 'text-right',
    },
    {
      name: 'Action',
      accessor: (row: any) =>
        row.type === 'adding_inventory' || row.type === 'clearance' ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleViewReceipt(row)}
            className="h-7 w-7"
            title="View receipt"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        ) : null,
      id: 'action',
      className: 'text-center',
      headerClassName: 'text-center',
    },
  ];

  if (!customerId) {
    return (
      <div className="w-full rounded-xl bg-white h-full mx-auto p-4">
        <p className="text-center text-muted-foreground">Invalid customer ID</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full rounded-2xl bg-background h-full mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/customers')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Customer Details</h1>
              <p className="text-xs text-muted-foreground">
                Complete ledger history
              </p>
            </div>
          </div>
          {customer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditCustomer(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : customer ? (
          <div className="space-y-4">
            {/* Compact Customer Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-lg">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium ">{customer.name}</p>
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

            {/* Compact Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-xl font-bold">
                  PKR {customer.balance?.toFixed(2) || '0.00'}
                </p>
                {customer.balance && customer.balance > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Outstanding
                  </Badge>
                )}
                {customer.balance && customer.balance < 0 && (
                  <Badge variant="default" className="text-xs mt-1">
                    Credit
                  </Badge>
                )}
                {(!customer.balance || customer.balance === 0) && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Clear
                  </Badge>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Entry Receipts</p>
                <p className="text-xl font-bold">
                  {customer._count?.entryReceipts || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Clearances</p>
                <p className="text-xl font-bold">
                  {customer._count?.clearanceReceipts || 0}
                </p>
              </div>
            </div>

            {/* Ledger with DataTable */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Ledger History</h2>
                <Button size="sm" onClick={() => setShowAddCash(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Cash
                </Button>
              </div>

              <DataTable
                columns={ledgerColumns}
                data={ledgerEntries}
                loading={loading}
                emptyMessage="No ledger entries found"
                skeletonRows={5}
                currentPage={page}
                lastPage={totalPages}
                onPageChange={setPage}
              />
            </div>

            {/* Compact Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-2 border-t">
              <div>
                <span className="font-medium">Created: </span>
                {new Date(customer.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div>
                <span className="font-medium">Updated: </span>
                {new Date(customer.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Customer not found</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => router.push('/customers')}
            >
              Back to Customers
            </Button>
          </div>
        )}
      </div>

      {customer && (
        <>
          <AddDirectCashDialog
            customerId={customer.id}
            customerName={customer.name}
            open={showAddCash}
            onOpenChange={setShowAddCash}
            onSuccess={fetchData}
          />

          <EditCustomerDialog
            customer={customer}
            open={showEditCustomer}
            onOpenChange={setShowEditCustomer}
            onSuccess={() => {
              setShowEditCustomer(false);
              fetchData();
            }}
          />
        </>
      )}
    </>
  );
}
