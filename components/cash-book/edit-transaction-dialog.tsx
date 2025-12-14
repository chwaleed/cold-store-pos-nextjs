'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import { toast } from 'sonner';
import { cashBookEntryUpdateSchema } from '@/schema/cash-book';
import type { CashBookEntryUpdate } from '@/schema/cash-book';
import type { CashBookEntry } from '@/types/cash-book';

interface EditTransactionDialogProps {
  transaction: CashBookEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: () => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CashBookEntryUpdate>({
    resolver: zodResolver(cashBookEntryUpdateSchema),
    defaultValues: {
      description: transaction.description,
      amount: transaction.amount,
      customerId: transaction.customerId || undefined,
    },
  });

  const customerId = watch('customerId');

  // Reset form when transaction changes
  useEffect(() => {
    reset({
      description: transaction.description,
      amount: transaction.amount,
      customerId: transaction.customerId || undefined,
    });
  }, [transaction, reset]);

  const onSubmit = async (data: CashBookEntryUpdate) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cash-book/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Transaction updated successfully');
        onTransactionUpdated();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update transaction');
      }
    } catch (error) {
      toast.error('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update the details of this manual transaction
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Info (Read-only) */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span>{' '}
                <span
                  className={
                    transaction.transactionType === 'inflow'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {transaction.transactionType === 'inflow'
                    ? 'Inflow'
                    : 'Outflow'}
                </span>
              </div>
              <div>
                <span className="font-medium">Source:</span>{' '}
                <span className="capitalize">{transaction.source}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">Created:</span>{' '}
              {new Date(transaction.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer (Optional)</Label>
            <CustomerSearchSelect
              value={customerId || 0}
              onValueChange={(value) =>
                setValue('customerId', value || undefined)
              }
              placeholder="Select customer (optional)..."
            />
            <p className="text-xs text-muted-foreground">
              Link this transaction to a specific customer if applicable
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
