'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { AddDirectCashDialog } from './add-direct-cash-dialog';

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

  const fetchData = async () => {
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
      }
      if (ledgerData.success) {
        setLedgerEntries(ledgerData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      fetchData();
    }
  }, [customerId, open]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details & Ledger</DialogTitle>
          </DialogHeader>

          {loading ? (
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
                            className="text-center text-muted-foreground"
                          >
                            No ledger entries found
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledgerEntries.map((entry: any) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getLedgerTypeBadge(entry.type)}
                            </TableCell>
                            <TableCell>
                              {entry.entryReceipt?.receiptNo ||
                                entry.clearanceReceipt?.clearanceNo ||
                                '-'}
                            </TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell className="text-right">
                              {entry.debitAmount > 0
                                ? `PKR ${entry.debitAmount.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.creditAmount > 0
                                ? `PKR ${entry.creditAmount.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
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
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Customer not found
            </p>
          )}
        </DialogContent>
      </Dialog>

      {customer && (
        <AddDirectCashDialog
          customerId={customer.id}
          customerName={customer.name}
          open={showAddCash}
          onOpenChange={setShowAddCash}
          onSuccess={fetchData}
        />
      )}
    </>
  );
}
