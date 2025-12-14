'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  FileSpreadsheet,
  Search,
  DollarSign,
  AlertCircle,
  CalendarIcon,
  Wallet,
  Activity,
  Receipt,
  HandCoins,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export function AuditReport() {
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });

      const res = await fetch(`/api/reports/profit-audit?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data.data);
        toast.success('Profit audit report generated successfully');
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportData) return;

    try {
      toast.loading('Generating PDF...');

      const response = await fetch('/api/reports/profit-audit/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit_audit_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    window.print();
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['PROFIT & AUDIT REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      ['Date Range', `${format(fromDate, 'PPP')} - ${format(toDate, 'PPP')}`],
      [],
      ['BUSINESS METRICS'],
      ['Metric', 'Amount (₨)'],
      ['Total Entry Amount', reportData.summary.totalEntryAmount.toFixed(2)],
      [
        'Total Clearance Amount',
        reportData.summary.totalClearanceAmount.toFixed(2),
      ],
      [],
      ['REVENUE & COSTS'],
      [
        'Cash Received (Excluding Loans)',
        reportData.summary.totalCashReceived.toFixed(2),
      ],
      ['Total Expenses', reportData.summary.totalExpenses.toFixed(2)],
      ['Total Discount Given', reportData.summary.totalDiscount.toFixed(2)],
      [],
      ['NET PROFIT'],
      [
        'Net Profit (Cash Received - Expenses - Discount)',
        reportData.summary.netProfit.toFixed(2),
      ],
      [],
      ['OTHER METRICS'],
      [
        'Total Outstanding Balance',
        reportData.summary.totalOutstandingBalance.toFixed(2),
      ],
      [
        'Direct Cash Given (Loans)',
        reportData.summary.totalDirectCashGiven.toFixed(2),
      ],
      [
        'Direct Cash Received (Loan Returns)',
        reportData.summary.totalDirectCashReceived.toFixed(2),
      ],
      [
        'Net Direct Cash (Outstanding Loans)',
        reportData.summary.netDirectCash.toFixed(2),
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Profit Audit');

    // Expense Breakdown Sheet
    if (Object.keys(reportData.breakdown.expensesByCategory).length > 0) {
      const expenseData = [
        ['EXPENSE BREAKDOWN BY CATEGORY'],
        [],
        ['Category', 'Amount (₨)'],
      ];

      Object.entries(reportData.breakdown.expensesByCategory).forEach(
        ([category, amount]: [string, any]) => {
          expenseData.push([category, amount.toFixed(2)]);
        }
      );

      const wsExpense = XLSX.utils.aoa_to_sheet(expenseData);
      wsExpense['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsExpense, 'Expense Breakdown');
    }

    XLSX.writeFile(
      wb,
      `profit_audit_report_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.xlsx`
    );
    toast.success('Excel exported');
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Filters */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-purple-500" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* From Date */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                From Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fromDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'PP') : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => date && setFromDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                To Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !toDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'PP') : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => date && setToDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate Button */}
            <div className="space-y-4">
              <Button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 mt-6"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Generating...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      {reportData && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadPDF}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Report Content */}
      {reportData ? (
        <div
          ref={printRef}
          className="space-y-6 animate-in fade-in-50 duration-500"
        >
          {/* Business Metrics */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Receipt className="h-4 w-4 text-blue-500" />
              Business Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompactMetricCard
                title="Total Entry Amount"
                value={`₨ ${reportData.summary.totalEntryAmount.toLocaleString()}`}
                icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                className="border-l-4 border-l-blue-500"
              />
              <CompactMetricCard
                title="Total Clearance Amount"
                value={`₨ ${reportData.summary.totalClearanceAmount.toLocaleString()}`}
                icon={<TrendingDown className="h-4 w-4 text-cyan-500" />}
                className="border-l-4 border-l-cyan-500"
              />
            </div>
          </div>

          {/* Revenue & Costs */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Wallet className="h-4 w-4 text-green-500" />
              Revenue & Costs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CompactMetricCard
                title="Cash Received"
                value={`₨ ${reportData.summary.totalCashReceived.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4 text-green-500" />}
                className="border-l-4 border-l-green-500"
              />
              <CompactMetricCard
                title="Total Expenses"
                value={`₨ ${reportData.summary.totalExpenses.toLocaleString()}`}
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                className="border-l-4 border-l-red-500"
              />
              <CompactMetricCard
                title="Total Discount"
                value={`₨ ${reportData.summary.totalDiscount.toLocaleString()}`}
                icon={<TrendingDown className="h-4 w-4 text-orange-500" />}
                className="border-l-4 border-l-orange-500"
              />
            </div>
          </div>

          {/* Net Profit - Highlighted */}
          <div className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  NET PROFIT
                </p>
                <p className="text-xs text-muted-foreground">
                  Cash Received - Expenses - Discount
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-3xl font-bold',
                    reportData.summary.netProfit >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  ₨ {reportData.summary.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Other Metrics */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Activity className="h-4 w-4 text-indigo-500" />
              Other Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompactMetricCard
                title="Outstanding Balance"
                value={`₨ ${reportData.summary.totalOutstandingBalance.toLocaleString()}`}
                icon={<Wallet className="h-4 w-4 text-indigo-500" />}
                className="border-l-4 border-l-indigo-500"
              />
              <CompactMetricCard
                title="Net Direct Cash (Loans)"
                value={`₨ ${reportData.summary.netDirectCash.toLocaleString()}`}
                icon={<HandCoins className="h-4 w-4 text-amber-500" />}
                className="border-l-4 border-l-amber-500"
              />
            </div>
          </div>

          {/* Loan Details */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <HandCoins className="h-4 w-4" />
              Direct Cash / Loan Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded border">
                <span className="text-xs font-medium">
                  Direct Cash Given (Loans)
                </span>
                <span className="text-xs font-bold text-red-600">
                  ₨ {reportData.summary.totalDirectCashGiven.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded border">
                <span className="text-xs font-medium">
                  Direct Cash Received (Returns)
                </span>
                <span className="text-xs font-bold text-green-600">
                  ₨{' '}
                  {reportData.summary.totalDirectCashReceived.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-semibold">
                  Net Outstanding Loans
                </span>
                <span className="text-xs font-bold text-amber-600">
                  ₨ {reportData.summary.netDirectCash.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          {Object.keys(reportData.breakdown.expensesByCategory).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                <AlertCircle className="h-4 w-4" />
                Expense Breakdown by Category
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(reportData.breakdown.expensesByCategory)
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([category, amount]: [string, any]) => {
                        const percentage =
                          (amount / reportData.summary.totalExpenses) * 100;
                        return (
                          <TableRow key={category}>
                            <TableCell className="font-medium">
                              {category}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              ₨ {amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[400px] bg-background/50 rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select date range and click "Generate Report" to see profit and
            audit analytics.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact Metric Card Component
function CompactMetricCard({ title, value, icon, className }: any) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-lg font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
