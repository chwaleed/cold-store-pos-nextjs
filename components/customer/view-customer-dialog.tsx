'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerWithBalance } from '@/types/customer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/customer/${customerId}`);
        const data = await response.json();

        if (data.success) {
          setCustomer(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && customerId) {
      fetchCustomer();
    }
  }, [customerId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : customer ? (
          <div className="space-y-6">
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
                <p className="text-sm text-muted-foreground">CNIC</p>
                <p className="font-medium">{customer.cnic || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Village</p>
                <p className="font-medium">{customer.village || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{customer.address || '-'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Balance</p>
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
                <p className="text-sm text-muted-foreground">Entry Receipts</p>
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

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p>
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>
                  {new Date(customer.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
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
  );
}
