'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DateSelector } from './date-selector';
import { CashSummaryCard } from './cash-summary-card';
import { TransactionList } from './transaction-list';
import { AddTransactionDialog } from './add-transaction-dialog';
import {
  CashBookFilters,
  type CashBookFilters as CashBookFiltersType,
} from './cash-book-filters';
import {
  CashBookErrorBoundary,
  useErrorHandler,
} from './cash-book-error-boundary';
import { CashBookKeyboardShortcuts } from './cash-book-keyboard-shortcuts';
import type { CashBookEntry, DailyCashSummary } from '@/types/cash-book';

export function CashBookPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<CashBookEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyCashSummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<CashBookFiltersType>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const handleError = useErrorHandler();

  // Load transactions with filters
  const loadTransactions = async (
    currentFilters: CashBookFiltersType = filters,
    page: number = 1
  ) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      // Use selected date if no date range filters are applied
      if (!currentFilters.dateFrom && !currentFilters.dateTo) {
        params.append('date', format(selectedDate, 'yyyy-MM-dd'));
      }

      if (currentFilters.dateFrom) {
        params.append(
          'dateFrom',
          format(currentFilters.dateFrom, 'yyyy-MM-dd')
        );
      }
      if (currentFilters.dateTo) {
        params.append('dateTo', format(currentFilters.dateTo, 'yyyy-MM-dd'));
      }
      if (
        currentFilters.transactionType &&
        currentFilters.transactionType !== 'all'
      ) {
        params.append('transactionType', currentFilters.transactionType);
      }
      if (currentFilters.source && currentFilters.source !== 'all') {
        params.append('source', currentFilters.source);
      }
      if (currentFilters.customerId) {
        params.append('customerId', currentFilters.customerId.toString());
      }
      if (currentFilters.search) {
        params.append('search', currentFilters.search);
      }
      if (currentFilters.sortBy) {
        params.append('sortBy', currentFilters.sortBy);
      }
      if (currentFilters.sortOrder) {
        params.append('sortOrder', currentFilters.sortOrder);
      }
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const transactionsRes = await fetch(
        `/api/cash-book?${params.toString()}`
      );
      const transactionsData = await transactionsRes.json();

      if (transactionsRes.ok) {
        setTransactions(transactionsData.data || []);
        setPagination(
          transactionsData.pagination || {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
          }
        );
        setError(null);
      } else {
        const errorMsg =
          transactionsData.error || 'Failed to load transactions';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to load transactions';
      setError(errorMsg);
      handleError(error as Error, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load daily summary for selected date
  const loadDailySummary = async (date: Date) => {
    setSummaryLoading(true);
    setError(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const summaryRes = await fetch(`/api/cash-book/summary?date=${dateStr}`);
      const summaryData = await summaryRes.json();

      if (summaryRes.ok) {
        setDailySummary(summaryData.data || summaryData.summary);
      } else {
        const errorMsg = summaryData.error || 'Failed to load daily summary';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to load daily summary';
      setError(errorMsg);
      handleError(error as Error, errorMsg);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Load data when date or filters change
  useEffect(() => {
    loadTransactions(filters, 1);
    // Only load daily summary if we're viewing a single date (not a range)
    if (!filters.dateFrom && !filters.dateTo) {
      loadDailySummary(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedDate,
    filters.dateFrom,
    filters.dateTo,
    filters.transactionType,
    filters.source,
    filters.customerId,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const handleRefresh = () => {
    loadTransactions(filters, pagination.page);
    if (!filters.dateFrom && !filters.dateTo) {
      loadDailySummary(selectedDate);
    }
  };

  const handleFiltersChange = (newFilters: CashBookFiltersType) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    loadTransactions(filters, page);
  };

  const handleTransactionAdded = () => {
    loadTransactions(filters, pagination.page);
    if (!filters.dateFrom && !filters.dateTo) {
      loadDailySummary(selectedDate);
    }
    setAddDialogOpen(false);
  };

  const handleTransactionUpdated = () => {
    loadTransactions(filters, pagination.page);
    if (!filters.dateFrom && !filters.dateTo) {
      loadDailySummary(selectedDate);
    }
  };

  const handleTransactionDeleted = () => {
    loadTransactions(filters, pagination.page);
    if (!filters.dateFrom && !filters.dateTo) {
      loadDailySummary(selectedDate);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Keyboard Shortcuts */}
      <CashBookKeyboardShortcuts
        onAddTransaction={() => setAddDialogOpen(true)}
        disabled={loading}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Date Selector - Only show when not using date range filters */}
      {!filters.dateFrom && !filters.dateTo && (
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Filters */}
      <CashBookFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Cash Summary - Only show for single date view */}
      {!filters.dateFrom && !filters.dateTo && (
        <CashSummaryCard
          summary={dailySummary}
          selectedDate={selectedDate}
          onSummaryUpdated={() => loadDailySummary(selectedDate)}
          loading={summaryLoading}
        />
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {filters.dateFrom || filters.dateTo ? (
                <>
                  Transactions
                  {filters.dateFrom && filters.dateTo && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({format(filters.dateFrom, 'MMM dd')} -{' '}
                      {format(filters.dateTo, 'MMM dd, yyyy')})
                    </span>
                  )}
                  {filters.dateFrom && !filters.dateTo && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (from {format(filters.dateFrom, 'MMM dd, yyyy')})
                    </span>
                  )}
                  {!filters.dateFrom && filters.dateTo && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (until {format(filters.dateTo, 'MMM dd, yyyy')})
                    </span>
                  )}
                </>
              ) : (
                `Transactions for ${format(selectedDate, 'MMMM dd, yyyy')}`
              )}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-normal text-muted-foreground">
                {pagination.total} transaction
                {pagination.total !== 1 ? 's' : ''}
                {pagination.totalPages > 1 && (
                  <span className="ml-2">
                    (Page {pagination.page} of {pagination.totalPages})
                  </span>
                )}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={transactions}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onTransactionUpdated={handleTransactionUpdated}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        selectedDate={selectedDate}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  );
}
