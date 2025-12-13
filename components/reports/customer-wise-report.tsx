'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Search,
  FileText,
  ChevronDown,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export function CustomerWiseReport() {
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      });

      const res = await fetch(`/api/reports/customer-wise?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data);
        toast.success('Customer-wise report generated successfully');
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
    window.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    // You can implement PDF generation here similar to other reports
    toast.success('PDF download functionality to be implemented');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['CUSTOMER-WISE REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      ['Date Range', `${format(fromDate, 'PPP')} - ${format(toDate, 'PPP')}`],
      [],
      [
        'Customer Name',
        'Entry Items Qty',
        'Cleared Items Qty',
        'Remaining Items Qty',
        'Balance (₨)',
      ],
    ];

    reportData.customers.forEach((customer: any) => {
      summaryData.push([
        customer.name,
        customer.entryQuantity,
        customer.clearedQuantity,
        customer.remainingQuantity,
        customer.balance.toFixed(2),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Customer-Wise Report');

    XLSX.writeFile(
      wb,
      `customer_wise_report_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.xlsx`
    );
    toast.success('Excel exported successfully');
  };

  return (
    <div className="flex flex-col mt-4 mx-auto">
      {/* Filters Card */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* From Date */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                From Date
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(fromDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setFromDate(newDate);
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(newDate) => newDate && setFromDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                To Date
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(toDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setToDate(newDate);
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={(newDate) => newDate && setToDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading}
                size="lg"
                className="w-full min-w-[150px]"
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
      <div className="flex mt-3 flex-col md:flex-row justify-end items-start md:items-center gap-4">
        {reportData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
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
        )}
      </div>

      {/* Report Display */}
      {reportData ? (
        <div
          ref={printRef}
          className="space-y-6 mt-3 animate-in fade-in-50 duration-500"
        >
          {/* Report Header */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Users className="h-6 w-6" />
                Customer-Wise Report
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Report Period: {format(fromDate, 'MMM dd, yyyy')} -{' '}
                {format(toDate, 'MMM dd, yyyy')}
              </div>
            </CardHeader>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Customers"
              value={reportData.summary.totalCustomers}
              description="Active customers in period"
            />
            <MetricCard
              title="Total Entry Items"
              value={reportData.summary.totalEntryQuantity}
              description="Items received"
            />
            <MetricCard
              title="Total Cleared Items"
              value={reportData.summary.totalClearedQuantity}
              description="Items cleared"
            />
            <MetricCard
              title="Total Outstanding Balance"
              value={`₨ ${Math.abs(reportData.summary.totalBalance).toFixed(2)}`}
              description={
                reportData.summary.totalBalance >= 0 ? 'Receivable' : 'Payable'
              }
            />
          </div>

          {/* Customer Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        Customer Name
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Entry Items Qty
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Cleared Items Qty
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Remaining Items Qty
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Balance (₨)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.customers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No customer data found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.customers.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.entryQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.clearedQuantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {customer.remainingQuantity}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              customer.balance > 0
                                ? 'text-red-600'
                                : customer.balance < 0
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                            )}
                          >
                            ₨ {Math.abs(customer.balance).toFixed(2)}
                            {customer.balance > 0 && (
                              <span className="text-xs ml-1">(Receivable)</span>
                            )}
                            {customer.balance < 0 && (
                              <span className="text-xs ml-1">(Payable)</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Empty State
        <div className="flex mt-3 flex-col items-center justify-center h-[400px] bg-background rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select date range above and click "Generate Report" to view
            customer-wise summary.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ title, value, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
