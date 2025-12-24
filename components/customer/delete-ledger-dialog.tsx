'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { LedgerWithReceipt } from '@/types/ledger';

interface DeleteLedgerDialogProps {
  ledgerEntry: LedgerWithReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteLedgerDialog({
  ledgerEntry,
  open,
  onOpenChange,
  onSuccess,
}: DeleteLedgerDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!ledgerEntry) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/ledger/${ledgerEntry.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Ledger entry deleted successfully',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete ledger entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting ledger entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ledger entry',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ledgerEntry) return null;

  const isSystemGenerated = ledgerEntry.entryReceiptId || ledgerEntry.clearanceReceiptId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Ledger Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isSystemGenerated ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                This is a system-generated entry linked to a receipt. 
                To delete this entry, you need to delete the associated receipt instead.
              </p>
              <div className="mt-2 text-xs text-yellow-700">
                {ledgerEntry.entryReceiptId && (
                  <p>Entry Receipt: {ledgerEntry.entryReceipt?.receiptNo}</p>
                )}
                {ledgerEntry.clearanceReceiptId && (
                  <p>Clearance Receipt: {ledgerEntry.clearanceReceipt?.clearanceNo}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this ledger entry? This action cannot be undone.
              </p>
              
              <div className="bg-foreground/10 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Description:</span>
                  <span>{ledgerEntry.description}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Amount:</span>
                  <span>
                    {ledgerEntry.debitAmount > 0 
                      ? `PKR ${ledgerEntry.debitAmount.toLocaleString()} (Debit)`
                      : `PKR ${ledgerEntry.creditAmount.toLocaleString()} (Credit)`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(ledgerEntry.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {!isSystemGenerated && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Entry'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}