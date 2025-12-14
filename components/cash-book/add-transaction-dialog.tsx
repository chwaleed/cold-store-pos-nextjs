'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import { toast } from 'sonner';
import { manualTransactionInputSchema } from '@/schema/cash-book';
import type { ManualTransactionInput } from '@/schema/cash-book';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onTransactionAdded: () => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  selectedDate,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ManualTransactionInput>({
    resolver: zodResolver(manualTransactionInputSchema),
    defaultValues: {
      date: selectedDate,
      transactionType: 'inflow',
      amount: 0,
      description: '',
      customerId: undefined,
    },
  });

  const transactionType = watch('transactionType');
  const customerId = watch('customerId');

  const onSubmit = async (data: ManualTransactionInput) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cash-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: format(data.date, 'yyyy-MM-dd'),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Transaction added successfully');
        reset({
          date: selectedDate,
          transactionType: 'inflow',
          amount: 0,
          description: '',
          customerId: undefined,
        });
        onTransactionAdded();
      } else {
        toast.error(result.error || 'Failed to add transaction');
      }
    } catch (error) {
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset({
      date: selectedDate,
      transactionType: 'inflow',
      amount: 0,
      description: '',
      customerId: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Manual Transaction</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a cash transaction that occurred outside the system
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={format(watch('date') || selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setValue('date', newDate);
                  }
                }}
              />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(value) =>
                  setValue('transactionType', value as 'inflow' | 'outflow')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Cash Inflow (Received)
                    </div>
                  </SelectItem>
                  <SelectItem value="outflow">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      Cash Outflow (Paid)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.transactionType && (
                <p className="text-sm text-destructive">
                  {errors.transactionType.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (PKR)
              {transactionType === 'inflow' && (
                <span className="text-xs text-green-600 ml-2">
                  (Money received)
                </span>
              )}
              {transactionType === 'outflow' && (
                <span className="text-xs text-red-600 ml-2">
                  (Money paid out)
                </span>
              )}
            </Label>
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
              placeholder="Enter transaction description (e.g., Cash payment from customer, Office supplies purchase, etc.)"
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
