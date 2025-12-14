'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpeningBalanceDialog } from './opening-balance-dialog';
import type { DailyCashSummary } from '@/types/cash-book';

interface CashSummaryCardProps {
  summary: DailyCashSummary | null;
  selectedDate: Date;
  onSummaryUpdated: () => void;
  loading?: boolean;
}

export function CashSummaryCard({
  summary,
  selectedDate,
  onSummaryUpdated,
  loading = false,
}: CashSummaryCardProps) {
  const [openingBalanceDialogOpen, setOpeningBalanceDialogOpen] =
    useState(false);

  const openingBalance = summary?.openingBalance || 0;
  const totalInflows = summary?.totalInflows || 0;
  const totalOutflows = summary?.totalOutflows || 0;
  const closingBalance = summary?.closingBalance || 0;
  const netCashFlow = totalInflows - totalOutflows;
  const isReconciled = summary?.isReconciled || false;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Opening Balance */}
        <Card className="relative hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opening Balance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpeningBalanceDialogOpen(true)}
              className="h-6 w-6 p-0 hover:bg-muted"
              title="Set Opening Balance"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₨ {openingBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Starting cash amount
            </p>
          </CardContent>
        </Card>

        {/* Total Inflows */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inflows
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₨ {totalInflows.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Cash received today</p>
          </CardContent>
        </Card>

        {/* Total Outflows */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outflows
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₨ {totalOutflows.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Cash paid out today</p>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow
            </CardTitle>
            <DollarSign
              className={cn(
                'h-4 w-4',
                netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {netCashFlow >= 0 ? '+' : ''}₨ {netCashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {netCashFlow >= 0 ? 'Net gain' : 'Net loss'} today
            </p>
          </CardContent>
        </Card>

        {/* Closing Balance */}
        <Card className="relative hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closing Balance
            </CardTitle>
            {isReconciled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₨ {closingBalance.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={isReconciled ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  isReconciled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                )}
              >
                {isReconciled ? 'Reconciled' : 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Info */}
      {summary && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Daily Summary for {format(selectedDate, 'MMMM dd, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(summary.updatedAt), 'PPp')}
                </p>
              </div>

              {summary.reconciledBy && (
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    Reconciled by {summary.reconciledBy}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.reconciledAt &&
                      format(new Date(summary.reconciledAt), 'PPp')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opening Balance Dialog */}
      <OpeningBalanceDialog
        open={openingBalanceDialogOpen}
        onOpenChange={setOpeningBalanceDialogOpen}
        selectedDate={selectedDate}
        currentBalance={openingBalance}
        onBalanceUpdated={onSummaryUpdated}
      />
    </>
  );
}
