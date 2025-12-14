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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateCashBookReportPDF } from '@/lib/pdf-generator.client';

interface CashBookReportsProps {
  className?: string;
}

export function CashBookReports({ className }: CashBookReportsProps) {
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [includeTransactionDetails, setIncludeTransactionDetails] =
    useState<boolean>(false);
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

      const res = await fetch(`/api/cash-book/reports?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data.data);
        toast.success('Cash book report generated successfully');
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    const filters = {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      includeTransactionDetails,
    };
    const doc = generateCashBookReportPDF(reportData, filters);
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const filters = {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      includeTransactionDetails,
    };
    const doc = generateCashBookReportPDF(reportData, filters);
    doc.download(
      `cash-book-report-${format(fromDate, 'yyyy-MM-dd')}-to-${format(toDate, 'yyyy-MM-dd')}.pdf`
    );
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['CASH BOOK REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      ['Date Range', `${format(fromDate, 'PPP')} - ${format(toDate, 'PPP')}`],
      [],
      ['SUMMARY'],
      ['Metric', 'Amount (₨)'],
      ['Opening Balance', reportData.summary.openingBalance.toFixed(2)],
      ['Total Inflows', reportData.summary.totalInflows.toFixed(2)],
      ['Total Outflows', reportData.summary.totalOutflows.toFixed(2)],
      ['Net Cash Flow', reportData.summary.netCashFlow.toFixed(2)],
      ['Closing Balance', reportData.summary.closingBalance.toFixed(2)],
      ['Total Transactions', reportData.summary.transactionCount],
      [],
      ['BREAKDOWN BY SOURCE'],
      ['Source', 'Inflows (₨)', 'Outflows (₨)', 'Net (₨)', 'Count'],
    ];

    Object.entries(reportData.transactionsBySource).forEach(
      ([source, data]: [string, any]) => {
        const net = data.inflows - data.outflows;
        summaryData.push([
          source.charAt(0).toUpperCase() + source.slice(1),
          data.inflows.toFixed(2),
          data.outflows.toFixed(2),
          net.toFixed(2),
          data.count,
        ]);
      }
    );

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Daily Summary Sheet
    if (reportData.dailySummaries && reportData.dailySummaries.length > 0) {
      const dailyData = [
        ['DAILY CASH SUMMARIES'],
        [],
        [
          'Date',
          'Opening Balance (₨)',
          'Inflows (₨)',
          'Outflows (₨)',
          'Closing Balance (₨)',
        ],
      ];

      reportData.dailySummaries.forEach((summary: any) => {
        dailyData.push([
          format(new Date(summary.date), 'PP'),
          summary.openingBalance.toFixed(2),
          summary.totalInflows.toFixed(2),
          summary.totalOutflows.toFixed(2),
          summary.closingBalance.toFixed(2),
        ]);
      });

      const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
      wsDaily['!cols'] = [
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Summaries');
    }

    // Transaction Details Sheet (if included)
    if (includeTransactionDetails && reportData.transactions.length > 0) {
      const transactionData = [
        ['TRANSACTION DETAILS'],
        [],
        [
          'Date',
          'Type',
          'Amount (₨)',
          'Description',
          'Source',
          'Customer',
          'Reference ID',
        ],
      ];

      reportData.transactions.forEach((transaction: any) => {
        transactionData.push([
          format(new Date(transaction.date), 'PP'),
          transaction.transactionType === 'inflow' ? 'Inflow' : 'Outflow',
          transaction.amount.toFixed(2),
          transaction.description,
          transaction.source.charAt(0).toUpperCase() +
            transaction.source.slice(1),
          transaction.customer?.name || '-',
          transaction.referenceId || '-',
        ]);
      });

      const wsTransactions = XLSX.utils.aoa_to_sheet(transactionData);
      wsTransactions['!cols'] = [
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transaction Details');
    }

    XLSX.writeFile(
      wb,
      `cash_book_report_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.xlsx`
    );
    toast.success('Excel exported');
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Filters */}
      <Card className="border-l-4 border-l-green-500 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-green-500" />
            Report Criteria
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

            {/* Generate Button and Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={includeTransactionDetails}
                  onCheckedChange={(checked) =>
                    setIncludeTransactionDetails(checked === true)
                  }
                />
                <Label
                  htmlFor="includeDetails"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include Transaction Details
                </Label>
              </div>

              <Button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
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
                <FileText className="mr-2 h-4 w-4" /> Download PDF
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Opening Balance"
              value={`₨ ${reportData.summary.openingBalance.toFixed(2)}`}
              icon={<DollarSign className="text-blue-500" />}
              className="border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="Total Inflows"
              value={`₨ ${reportData.summary.totalInflows.toFixed(2)}`}
              icon={<TrendingUp className="text-green-500" />}
              className="border-l-4 border-l-green-500"
            />
            <MetricCard
              title="Total Outflows"
              value={`₨ ${reportData.summary.totalOutflows.toFixed(2)}`}
              icon={<TrendingDown className="text-red-500" />}
              className="border-l-4 border-l-red-500"
            />
            <MetricCard
              title="Net Cash Flow"
              value={`₨ ${reportData.summary.netCashFlow.toFixed(2)}`}
              icon={<Activity className="text-purple-500" />}
              className="border-l-4 border-l-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Breakdown by Source
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right text-green-600">
                          Inflows
                        </TableHead>
                        <TableHead className="text-right text-red-600">
                          Outflows
                        </TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.transactionsBySource).map(
                        ([source, data]: [string, any]) => {
                          const net = data.inflows - data.outflows;
                          return (
                            <TableRow key={source}>
                              <TableCell className="font-medium">
                                {source.charAt(0).toUpperCase() +
                                  source.slice(1)}
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                ₨ {data.inflows.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                ₨ {data.outflows.toFixed(2)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'text-right font-medium',
                                  net >= 0 ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                ₨ {net.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Daily Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dailySummaries.map((summary: any) => (
                        <TableRow key={summary.date}>
                          <TableCell className="font-medium">
                            {format(new Date(summary.date), 'PP')}
                          </TableCell>
                          <TableCell className="text-right">
                            ₨ {summary.openingBalance.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₨ {summary.closingBalance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details */}
          {includeTransactionDetails && reportData.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Transaction Details ({reportData.transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="bg-background/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Customer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-xs">
                            {format(new Date(transaction.date), 'PP')}
                          </TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                transaction.transactionType === 'inflow'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              )}
                            >
                              {transaction.transactionType === 'inflow' ? (
                                <ArrowDownLeft className="h-3 w-3" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3" />
                              )}
                              {transaction.transactionType === 'inflow'
                                ? 'In'
                                : 'Out'}
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              transaction.transactionType === 'inflow'
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            ₨ {transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-xs">
                            {transaction.source.charAt(0).toUpperCase() +
                              transaction.source.slice(1)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {transaction.customer?.name || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[400px] bg-background/50 rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select date range and click "Generate Report" to see cash book
            analytics.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper Stats Component
function MetricCard({ title, value, icon, className }: any) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
