'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  User,
  Building,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EditTransactionDialog } from './edit-transaction-dialog';
import type { CashBookEntry } from '@/types/cash-book';

interface TransactionListProps {
  transactions: CashBookEntry[];
  loading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onTransactionUpdated: () => void;
  onTransactionDeleted: () => void;
}

export function TransactionList({
  transactions,
  loading,
  pagination,
  onPageChange,
  onTransactionUpdated,
  onTransactionDeleted,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] =
    useState<CashBookEntry | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<CashBookEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/cash-book/${deletingTransaction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Transaction deleted successfully');
        onTransactionDeleted();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Failed to delete transaction');
    } finally {
      setDeleteLoading(false);
      setDeletingTransaction(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'clearance':
        return <Receipt className="h-4 w-4" />;
      case 'ledger':
        return <User className="h-4 w-4" />;
      case 'expense':
        return <Building className="h-4 w-4" />;
      case 'manual':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'clearance':
        return 'Clearance';
      case 'ledger':
        return 'Ledger';
      case 'expense':
        return 'Expense';
      case 'manual':
        return 'Manual';
      default:
        return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'clearance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'ledger':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'expense':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'manual':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No transactions found
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          No cash transactions recorded for this date.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-sm">
                  {format(new Date(transaction.createdAt), 'HH:mm:ss')}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {transaction.transactionType === 'inflow' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        transaction.transactionType === 'inflow'
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {transaction.transactionType === 'inflow'
                        ? 'Inflow'
                        : 'Outflow'}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {transaction.description}
                      </p>
                      {transaction.isDirectCash && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Loan
                        </Badge>
                      )}
                    </div>
                    {transaction.referenceId && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {transaction.referenceType} #
                        {transaction.referenceId}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn('gap-1', getSourceColor(transaction.source))}
                  >
                    {getSourceIcon(transaction.source)}
                    {getSourceLabel(transaction.source)}
                  </Badge>
                </TableCell>

                <TableCell>
                  {transaction.customer ? (
                    <div>
                      <p className="font-medium">{transaction.customer.name}</p>
                      {transaction.customer.phone && (
                        <p className="text-xs text-muted-foreground">
                          {transaction.customer.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-bold',
                      transaction.transactionType === 'inflow'
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {transaction.transactionType === 'inflow' ? '+' : '-'}₨{' '}
                    {transaction.amount.toLocaleString()}
                  </span>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {transaction.source === 'manual' && (
                        <DropdownMenuItem
                          onClick={() => setEditingTransaction(transaction)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}

                      {transaction.referenceId && (
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Source
                        </DropdownMenuItem>
                      )}

                      {transaction.source === 'manual' && (
                        <DropdownMenuItem
                          onClick={() => setDeletingTransaction(transaction)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={loading}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open: boolean) => !open && setEditingTransaction(null)}
          onTransactionUpdated={onTransactionUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={(open: boolean) => !open && setDeletingTransaction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
              <br />
              <br />
              <strong>Transaction:</strong> {deletingTransaction?.description}
              <br />
              <strong>Amount:</strong> ₨{' '}
              {deletingTransaction?.amount.toLocaleString()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
