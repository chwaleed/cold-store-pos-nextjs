'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { openingBalanceSchema } from '@/schema/cash-book';
import type { OpeningBalanceInput } from '@/schema/cash-book';

interface OpeningBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  currentBalance: number;
  onBalanceUpdated: () => void;
}

export function OpeningBalanceDialog({
  open,
  onOpenChange,
  selectedDate,
  currentBalance,
  onBalanceUpdated,
}: OpeningBalanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [previousDayBalance, setPreviousDayBalance] = useState<number | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OpeningBalanceInput>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      date: selectedDate,
      openingBalance: currentBalance,
    },
  });

  const openingBalance = watch('openingBalance');

  // Load previous day's closing balance when dialog opens
  useEffect(() => {
    if (open) {
      loadPreviousDayBalance();
      reset({
        date: selectedDate,
        openingBalance: currentBalance,
      });
    }
  }, [open, selectedDate, currentBalance, reset]);

  const loadPreviousDayBalance = async () => {
    try {
      const previousDay = new Date(selectedDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const dateStr = format(previousDay, 'yyyy-MM-dd');

      const response = await fetch(`/api/cash-book/summary?date=${dateStr}`);
      const data = await response.json();

      if (response.ok && data.summary) {
        setPreviousDayBalance(data.summary.closingBalance);
        // If current balance is 0, suggest using previous day's closing balance
        if (currentBalance === 0) {
          setValue('openingBalance', data.summary.closingBalance);
        }
      } else {
        setPreviousDayBalance(null);
      }
    } catch (error) {
      setPreviousDayBalance(null);
    }
  };

  const onSubmit = async (data: OpeningBalanceInput) => {
    setLoading(true);
    try {
      // Validate that the new balance is different from current
      if (data.openingBalance === currentBalance) {
        toast.info('No changes made to opening balance');
        onOpenChange(false);
        return;
      }

      // Prepare audit trail information
      const changeReason =
        Math.abs(data.openingBalance - currentBalance) > 1000
          ? `Significant balance adjustment: ${data.openingBalance > currentBalance ? 'Increase' : 'Decrease'} of ₨${Math.abs(data.openingBalance - currentBalance).toLocaleString()}`
          : 'Opening balance adjustment';

      const response = await fetch('/api/cash-book/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(data.date, 'yyyy-MM-dd'),
          openingBalance: data.openingBalance,
          changeReason,
          changedBy: 'User', // In a real app, this would be the logged-in user
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const message = result.auditCreated
          ? 'Opening balance updated successfully (audit trail created)'
          : 'Opening balance set successfully';
        toast.success(message);
        onBalanceUpdated();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update opening balance');
      }
    } catch (error) {
      toast.error('Failed to update opening balance');
    } finally {
      setLoading(false);
    }
  };

  const usePreviousDayBalance = () => {
    if (previousDayBalance !== null) {
      setValue('openingBalance', previousDayBalance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Opening Balance</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set the cash amount available at the start of{' '}
            {format(selectedDate, 'MMMM dd, yyyy')}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Previous Day Balance Info */}
          {previousDayBalance !== null && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Previous day's closing balance:{' '}
                <strong>₨ {previousDayBalance.toLocaleString()}</strong>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={usePreviousDayBalance}
                  className="ml-2 h-auto p-0"
                >
                  Use this amount
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for significant changes */}
          {Math.abs(openingBalance - currentBalance) > 1000 &&
            currentBalance > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Significant Change Warning:</strong> You're changing
                  the opening balance by ₨{' '}
                  {Math.abs(openingBalance - currentBalance).toLocaleString()}.
                  This will affect all calculations for this day and create an
                  audit trail record.
                </AlertDescription>
              </Alert>
            )}

          {/* Validation warning for negative impact */}
          {openingBalance < 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Opening balance cannot be negative. Please enter a valid amount.
              </AlertDescription>
            </Alert>
          )}

          {/* Info for future dates */}
          {selectedDate > new Date() && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You're setting an opening balance for a future date. Ensure this
                is intentional.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance (PKR)</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('openingBalance', { valueAsNumber: true })}
            />
            {errors.openingBalance && (
              <p className="text-sm text-destructive">
                {errors.openingBalance.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the actual cash amount you had at the beginning of this day
            </p>
          </div>

          {/* Current vs New Balance Comparison */}
          {openingBalance !== currentBalance && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Balance Change Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current opening balance:</span>
                  <span>₨ {currentBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>New opening balance:</span>
                  <span>₨ {openingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Difference:</span>
                  <span
                    className={
                      openingBalance > currentBalance
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {openingBalance > currentBalance ? '+' : ''}₨{' '}
                    {(openingBalance - currentBalance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
