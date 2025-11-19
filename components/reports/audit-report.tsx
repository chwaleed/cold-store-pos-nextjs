'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Search,
  DollarSign,
  Package,
  Warehouse,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { YearMonthPicker } from '@/components/ui/year-month-picker';
import { generateAuditReportPDF } from '@/lib/pdf-generator.client';

export function AuditReport() {
  const [period, setPeriod] = useState<string>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        date: date.toISOString(),
      });

      const res = await fetch(`/api/reports/audit?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data);
        toast.success('Audit report generated successfully');
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
    const doc = generateAuditReportPDF(reportData);
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = generateAuditReportPDF(reportData);
    doc.download(
      `audit_report_${reportData.period.year}_${reportData.period.month || 'full'}.pdf`
    );
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['AUDIT REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      ['Period Type', reportData.period.type === 'month' ? 'Monthly' : 'Yearly'],
      ['Date Range', `${format(new Date(reportData.period.startDate), 'PPP')} - ${format(new Date(reportData.period.endDate), 'PPP')}`],
      [],
      ['FINANCIAL SUMMARY'],
      ['Metric', 'Amount (₨)'],
      ['Total Revenue', reportData.financial.totalRevenue.toFixed(2)],
      ['Total Costs', reportData.financial.totalCosts.toFixed(2)],
      ['Net Profit/Loss', reportData.financial.profitLoss.toFixed(2)],
      ['Profit Margin (%)', reportData.financial.profitMargin],
      ['Outstanding Balance', reportData.financial.outstandingBalance.toFixed(2)],
      ['Payments Received', reportData.financial.paymentsReceived.toFixed(2)],
      [],
      ['OPERATIONS SUMMARY'],
      ['Category', 'Amount (₨)', 'Quantity', 'Receipts'],
      ['Entry Operations', reportData.entry?.totalAmount?.toFixed(2) || '0', reportData.entry?.totalQuantity || '0', reportData.entry?.totalReceipts || '0'],
      ['Clearance Operations', reportData.clearance?.totalAmount?.toFixed(2) || '0', reportData.clearance?.totalQuantity || '0', reportData.clearance?.totalReceipts || '0'],
      [],
      ['INVENTORY STATUS'],
      ['Total Inventory Value', reportData.inventory?.totalValue?.toFixed(2) || '0'],
      ['Items in Stock', reportData.inventory?.itemCount || '0'],
      ['Total Quantity', reportData.inventory?.totalQuantity || '0'],
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    
    // Expenses Sheet
    if (reportData.expenses && Object.keys(reportData.expenses.byCategory || {}).length > 0) {
      const expenseData = [
        ['EXPENSE BREAKDOWN'],
        ['Total Expenses', reportData.expenses.total?.toFixed(2) || '0'],
        ['Number of Expenses', reportData.expenses.count || '0'],
        [],
        ['Category', 'Amount (₨)'],
      ];
      
      Object.entries(reportData.expenses.byCategory || {}).forEach(([category, amount]: [string, any]) => {
        expenseData.push([category, amount.toFixed(2)]);
      });
      
      const ws2 = XLSX.utils.aoa_to_sheet(expenseData);
      ws2['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Expenses');
    }
    
    // Room Utilization Sheet
    if (reportData.rooms?.utilization && reportData.rooms.utilization.length > 0) {
      const roomData = [
        ['ROOM UTILIZATION'],
        [],
        ['Room Name', 'Type', 'Capacity', 'Current Items', 'Current Quantity'],
      ];
      
      reportData.rooms.utilization.forEach((room: any) => {
        roomData.push([
          room.name,
          room.type,
          room.capacity,
          room.currentItems,
          room.currentQuantity,
        ]);
      });
      
      const ws3 = XLSX.utils.aoa_to_sheet(roomData);
      ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Room Utilization');
    }
    
    XLSX.writeFile(wb, `audit_report_${reportData.period.year}_${reportData.period.month || 'full'}.xlsx`);
    toast.success('Excel exported successfully');
  };

  return (
    <div className="flex flex-col gap-6 mt-4 mx-auto">
      {/* --- Header --- */}

      {/* --- Filters --- */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Report Period
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly Audit</SelectItem>
                  <SelectItem value="year">Yearly Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Select {period === 'month' ? 'Month' : 'Year'}
              </Label>
              <YearMonthPicker
                value={date}
                onChange={setDate}
                mode={period as 'year' | 'month'}
              />
            </div>

            <Button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Generating...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Generate Audit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
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

      {/* --- Report Content --- */}
      {reportData ? (
        <div
          ref={printRef}
          className="space-y-8 animate-in fade-in-50 duration-500"
        >
          {/* 1. Financial Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Total Revenue
                </div>
                <div className="text-2xl font-bold">
                  ₨ {reportData.financial.totalRevenue.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <DollarSign className="h-3 w-3 mr-1" /> Gross Income
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Total Costs
                </div>
                <div className="text-2xl font-bold">
                  ₨ {reportData.financial.totalCosts.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" /> Expenses
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border-l-4',
                reportData.financial.profitLoss >= 0
                  ? 'border-l-green-500'
                  : 'border-l-orange-500'
              )}
            >
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Net Profit / Loss
                </div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    reportData.financial.profitLoss >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  ₨ {Math.abs(reportData.financial.profitLoss).toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {reportData.financial.profitLoss >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  Margin: {reportData.financial.profitMargin}%
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Outstanding Balance
                </div>
                <div className="text-2xl font-bold">
                  ₨ {reportData.financial.outstandingBalance.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-yellow-600 mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" /> Pending Payments
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Detailed Tabs */}
          <Tabs defaultValue="operations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="operations">Recipts</TabsTrigger>
              <TabsTrigger className="px-6" value="inventory">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* TAB 1: Operations (Entry vs Clearance) */}
            <TabsContent value="operations" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-foreground/5 rounded-t-xl border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" /> Entry
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Amount
                      </span>
                      <span className="font-bold text-lg">
                        ₨ {reportData.entry.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Quantity
                      </span>
                      <span className="font-medium">
                        {reportData.entry.totalQuantity.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Receipts
                      </span>
                      <Badge variant="secondary">
                        {reportData.entry.totalReceipts}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="bg-foreground/5 rounded-t-xl border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" /> Clearance
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Amount
                      </span>
                      <span className="font-bold text-lg">
                        ₨ {reportData.clearance.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Quantity
                      </span>
                      <span className="font-medium">
                        {reportData.clearance.totalQuantity.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Receipts
                      </span>
                      <Badge variant="secondary">
                        {reportData.clearance.totalReceipts}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: Inventory & Rooms */}
            <TabsContent value="inventory" className="mt-4 space-y-6">
              {/* Inventory Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-foreground/5 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">
                    Current Inventory Value
                  </div>
                  <div className="text-xl font-bold ">
                    ₨ {reportData.inventory?.totalValue?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-foreground/5 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">
                    Items in Stock
                  </div>
                  <div className="text-xl font-bold ">
                    {reportData.inventory?.itemCount || 0} Types
                  </div>
                </div>
                <div className="bg-foreground/5 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">
                    Total Quantity
                  </div>
                  <div className="text-xl font-bold ">
                    {reportData.inventory?.totalQuantity || 0} Units
                  </div>
                </div>
              </div>

              {/* Room Utilization Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Warehouse className="h-4 w-4" /> Room Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">
                          Items Stored
                        </TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.rooms.utilization.map((room: any) => (
                        <TableRow key={room.name}>
                          <TableCell className="font-medium">
                            {room.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                room.type === 'COLD' ? 'default' : 'outline'
                              }
                              className={
                                room.type === 'COLD'
                                  ? 'bg-blue-500 hover:bg-blue-600'
                                  : ''
                              }
                            >
                              {room.type}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {room.currentItems}
                          </TableCell>
                          <TableCell className="text-right">
                            {room.currentQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Expenses */}
            <TabsContent value="expenses" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Expense Breakdown
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Total:{' '}
                      <span className="font-bold text-foreground">
                        ₨ {reportData.expenses.total.toFixed(2)}
                      </span>
                      <span className="mx-2">•</span>
                      Count:{' '}
                      <span className="font-bold text-foreground">
                        {reportData.expenses.count}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right w-[100px]">
                          %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.expenses.byCategory).map(
                        ([category, amount]: any) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">
                              {category}
                            </TableCell>
                            <TableCell className="text-right">
                              ₨ {amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {reportData.expenses.total > 0
                                ? (
                                    (amount / reportData.expenses.total) *
                                    100
                                  ).toFixed(1) + '%'
                                : '0%'}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                      {Object.keys(reportData.expenses.byCategory).length ===
                        0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No expenses recorded for this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Note */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Audit generated on {format(new Date(), 'PPP p')} •{' '}
            {period === 'month' ? 'Monthly' : 'Yearly'} Report
          </div>
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[400px] bg-background/50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Audit Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select an audit period (Monthly/Yearly) and date above to generate a
            comprehensive report.
          </p>
        </div>
      )}
    </div>
  );
}
