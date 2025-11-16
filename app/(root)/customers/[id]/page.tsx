'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Eye, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerWithBalance } from '@/types/customer';
import { LedgerWithReceipt } from '@/types/ledger';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddDirectCashDialog } from '@/components/customer/add-direct-cash-dialog';
import { EditCustomerDialog } from '@/components/customer/edit-customer-dialog';
import { useToast } from '@/components/ui/use-toast';

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

  const fetchData = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const [customerRes, ledgerRes] = await Promise.all([
        fetch(`/api/customer/${customerId}`),
        fetch(`/api/ledger?customerId=${customerId}`),
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
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleViewReceipt = (entry: LedgerWithReceipt) => {
    console.log('Viewing receipt for entry:', entry);
    if (entry.type === 'adding_inventory' && entry.entryReceiptId) {
      router.push(`/records/${entry.entryReceipt?.id}/preview`);
    } else if (entry.type === 'clearance' && entry.clearanceReceiptId) {
      router.push(`/clearance/${entry.clearanceReceiptId}`);
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

  if (!customerId) {
    return (
      <div className="w-full rounded-xl bg-white h-full mx-auto p-4">
        <p className="text-center text-muted-foreground">Invalid customer ID</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full rounded-xl bg-white h-full mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/customers')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Customer Details</h1>
              <p className="text-muted-foreground">
                View complete customer information and ledger history
              </p>
            </div>
          </div>
          {customer && (
            <Button variant="outline" onClick={() => setShowEditCustomer(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Customer Information Card */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-lg">{customer.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Father Name</p>
                  <p className="font-medium text-lg">
                    {customer.fatherName || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-lg">{customer.phone || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Village</p>
                  <p className="font-medium text-lg">
                    {customer.village || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-lg">
                    {customer.address || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Summary Card */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Account Balance
                  </p>
                  <p className="text-3xl font-bold mb-2">
                    PKR {customer.balance?.toFixed(2) || '0.00'}
                  </p>
                  {customer.balance && customer.balance > 0 && (
                    <Badge variant="destructive">Outstanding</Badge>
                  )}
                  {customer.balance && customer.balance < 0 && (
                    <Badge variant="default">Credit Balance</Badge>
                  )}
                  {(!customer.balance || customer.balance === 0) && (
                    <Badge variant="secondary">All Clear</Badge>
                  )}
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Entry Receipts
                  </p>
                  <p className="text-3xl font-bold">
                    {customer._count?.entryReceipts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total inventory entries
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Clearance Receipts
                  </p>
                  <p className="text-3xl font-bold">
                    {customer._count?.clearanceReceipts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total clearance transactions
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Ledger Section */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Ledger History</h2>
                  <p className="text-sm text-muted-foreground">
                    Complete transaction history for this customer
                  </p>
                </div>
                <Button onClick={() => setShowAddCash(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cash Entry
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground h-32"
                        >
                          No ledger entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {new Date(entry.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            {getLedgerTypeBadge(entry.type)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.entryReceipt?.receiptNo ||
                              entry.clearanceReceipt?.clearanceNo ||
                              '-'}
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.debitAmount > 0 ? (
                              <span className="text-red-600">
                                PKR {entry.debitAmount.toFixed(2)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.creditAmount > 0 ? (
                              <span className="text-green-600">
                                PKR {entry.creditAmount.toFixed(2)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            PKR {entry.balance?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-center">
                            {(entry.type === 'adding_inventory' ||
                              entry.type === 'clearance') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewReceipt(entry)}
                                className="h-8 w-8"
                                title="View receipt details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium">Created At</p>
                <p>
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <p className="font-medium">Last Updated</p>
                <p>
                  {new Date(customer.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Customer not found</p>
            <Button className="mt-4" onClick={() => router.push('/customers')}>
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
