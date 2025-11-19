'use client';

import { useState, useEffect, useRef } from 'react';
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
  ArrowDown,
  ArrowUp,
  MoreVertical,
  ChevronDown,
  X,
  Search,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateCustomerReportPDF } from '@/lib/pdf-generator.client';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import useStore from '@/app/(root)/(store)/store';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function DailyReport() {
  const { types: productTypes, subType: productSubTypes } = useStore();
  const [filteredSubTypes, setFilteredSubTypes] = useState<any[]>([]);

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [selectedSubType, setSelectedSubType] = useState<string | undefined>(
    undefined
  );
  const [reportType, setReportType] = useState<string>('both');
  const [period, setPeriod] = useState<string>('day');
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedType) {
      const filtered = productSubTypes.filter(
        (st) => st.productTypeId === parseInt(selectedType)
      );
      setFilteredSubTypes(filtered);
      setSelectedSubType(undefined);
    } else {
      setFilteredSubTypes([]);
    }
  }, [selectedType, productSubTypes]);

  const generateReport = async () => {
    if (!selectedCustomer || selectedCustomer === 0) {
      toast.error('Please select a customer');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        customerId: selectedCustomer.toString(),
        reportType,
        period,
        date: date.toISOString(),
        ...(selectedType && { productTypeId: selectedType }),
        ...(selectedSubType && { productSubTypeId: selectedSubType }),
      });

      const res = await fetch(`/api/reports/customer?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data);
        toast.success('Report generated successfully');
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
    const doc = generateCustomerReportPDF(reportData, {
      period,
      date: date.toISOString(),
      reportType,
    });
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = generateCustomerReportPDF(reportData, {
      period,
      date: date.toISOString(),
      reportType,
    });
    doc.download(
      `customer_report_${reportData.customer.name}_${format(date, 'yyyy-MM-dd')}.pdf`
    );
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['CUSTOMER REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      [],
      ['CUSTOMER INFORMATION'],
      ['Name', reportData.customer.name],
      ['Phone', reportData.customer.phone || 'N/A'],
      [
        'Period',
        period === 'day'
          ? 'Daily'
          : period === 'month'
            ? 'Monthly'
            : period === 'year'
              ? 'Yearly'
              : 'Lifetime',
      ],
      ['Date', format(date, 'PPP')],
      [],
      ['FINANCIAL SUMMARY'],
      ['Net Balance', `₨ ${Math.abs(reportData.balance).toFixed(2)}`],
      [
        'Balance Status',
        reportData.balance > 0
          ? 'Receivable from Customer'
          : reportData.balance < 0
            ? 'Payable to Customer'
            : 'Settled',
      ],
    ];

    if (reportData.entryData) {
      summaryData.push(
        [],
        ['ENTRY SUMMARY'],
        ['Total Amount', `₨ ${reportData.entryData.totalAmount.toFixed(2)}`],
        ['Total Quantity', reportData.entryData.totalQuantity],
        ['Number of Receipts', reportData.entryData.receipts.length]
      );
    }

    if (reportData.clearanceData) {
      summaryData.push(
        [],
        ['CLEARANCE SUMMARY'],
        [
          'Total Amount',
          `₨ ${reportData.clearanceData.totalAmount.toFixed(2)}`,
        ],
        ['Total Quantity', reportData.clearanceData.totalQuantity],
        ['Number of Receipts', reportData.clearanceData.receipts.length]
      );
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Entry Receipts Sheet
    if (
      reportData.entryData?.receipts &&
      reportData.entryData.receipts.length > 0
    ) {
      const entryData = [
        ['ENTRY RECEIPTS'],
        [],
        [
          'Receipt No',
          'Date',
          'Product Type',
          'Sub Type',
          'Quantity',
          'Unit Price',
          'Total Amount',
        ],
      ];

      reportData.entryData.receipts.forEach((receipt: any) => {
        receipt.items.forEach((item: any) => {
          entryData.push([
            receipt.receiptNo,
            format(new Date(receipt.entryDate), 'PP'),
            item.productType.name,
            item.productSubType?.name || '-',
            item.quantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalPrice || 0).toFixed(2),
          ]);
        });
      });

      const ws2 = XLSX.utils.aoa_to_sheet(entryData);
      ws2['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Entry Receipts');
    }

    // Clearance Receipts Sheet
    if (
      reportData.clearanceData?.receipts &&
      reportData.clearanceData.receipts.length > 0
    ) {
      const clearanceData = [
        ['CLEARANCE RECEIPTS'],
        [],
        [
          'Clearance No',
          'Date',
          'Product Type',
          'Sub Type',
          'Quantity',
          'Unit Price',
          'Total Amount',
        ],
      ];

      reportData.clearanceData.receipts.forEach((receipt: any) => {
        receipt.clearedItems.forEach((item: any) => {
          clearanceData.push([
            receipt.clearanceNo,
            format(new Date(receipt.clearanceDate), 'PP'),
            item.entryItem.productType.name,
            item.entryItem.productSubType?.name || '-',
            item.clearQuantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalAmount || 0).toFixed(2),
          ]);
        });
      });

      const ws3 = XLSX.utils.aoa_to_sheet(clearanceData);
      ws3['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Clearance Receipts');
    }

    XLSX.writeFile(
      wb,
      `customer_report_${reportData.customer.name}_${format(date, 'yyyy-MM-dd')}.xlsx`
    );
    toast.success('Excel exported successfully');
  };

  return (
    <div className="flex flex-col mt-4  mx-auto">
      {/* --- Header Section --- */}

      {/* --- Filters Card --- */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Row 1: Core Filters */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Customer
              </Label>
              <CustomerSearchSelect
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
                placeholder="Select customer..."
              />
            </div>

            <div className="space-y-2 ">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Time Period
              </Label>
              <div className="flex gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>

                {period !== 'lifetime' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start text-left font-normal px-3',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PP') : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Report Type
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">All Transactions</SelectItem>
                  <SelectItem value="entry">Entry Only</SelectItem>
                  <SelectItem value="clearance">Clearance Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Advanced/Product Filters */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Product Filter
                </Label>
                {(selectedType || selectedSubType) && (
                  <span
                    className="text-xs text-red-500 cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedType(undefined);
                      setSelectedSubType(undefined);
                    }}
                  >
                    Clear
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedSubType}
                  onValueChange={setSelectedSubType}
                  disabled={!selectedType}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sub" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubTypes.map((subType) => (
                      <SelectItem
                        key={subType.id}
                        value={subType.id.toString()}
                      >
                        {subType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={generateReport}
              disabled={loading}
              size="lg"
              className="w-full md:w-auto min-w-[150px]"
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
        </CardContent>
      </Card>

      <div className="flex mt-3  flex-col md:flex-row justify-end  items-start md:items-center gap-4">
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

      {/* --- Report Display --- */}
      {reportData ? (
        <div
          ref={printRef}
          className="space-y-6 mt-3 animate-in fade-in-50 duration-500"
        >
          {/* Report Summary Header */}
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  {reportData.customer.name}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {reportData.customer.phone || 'No phone number'} •{' '}
                  {reportData.customer.address || 'No address'}
                </CardDescription>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-sm text-muted-foreground">
                  Report Period
                </div>
                <div className="font-medium">
                  {period === 'lifetime'
                    ? 'Lifetime History'
                    : format(date, 'MMMM do, yyyy')}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Net Balance"
              value={`₨ ${Math.abs(reportData.balance).toFixed(2)}`}
              description={
                reportData.balance > 0
                  ? 'Receivable from Customer'
                  : reportData.balance < 0
                    ? 'Payable to Customer'
                    : 'Settled'
              }
              trend={
                reportData.balance > 0
                  ? 'down'
                  : reportData.balance < 0
                    ? 'up'
                    : 'neutral'
              }
              color={
                reportData.balance > 0
                  ? 'text-red-600'
                  : reportData.balance < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
              }
            />
            {(reportType === 'both' || reportType === 'entry') &&
              reportData.entryData && (
                <MetricCard
                  title="Total Entry"
                  value={`₨ ${reportData.entryData.totalAmount.toFixed(2)}`}
                  description={`${reportData.entryData.totalQuantity} items across ${reportData.entryData.receipts.length} receipts`}
                  icon={<ArrowDown className="h-4 w-4 text-blue-500" />}
                />
              )}
            {(reportType === 'both' || reportType === 'clearance') &&
              reportData.clearanceData && (
                <MetricCard
                  title="Total Clearance"
                  value={`₨ ${reportData.clearanceData.totalAmount.toFixed(2)}`}
                  description={`${reportData.clearanceData.totalQuantity} items across ${reportData.clearanceData.receipts.length} receipts`}
                  icon={<ArrowUp className="h-4 w-4 text-emerald-500" />}
                />
              )}
          </div>

          {/* Entry Details Section */}
          {(reportType === 'both' || reportType === 'entry') &&
            reportData.entryData?.receipts.length > 0 && (
              <Card>
                <CardHeader className="bg-background/50 rounded-2xl border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-foreground/10 rounded-md">
                      <ArrowDown className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Entry Details</CardTitle>
                      <CardDescription>
                        Items received from customer
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.entryData.receipts.map((receipt: any) =>
                        receipt.items.map((item: any, idx: number) => (
                          <TableRow key={`${receipt.id}-${idx}`}>
                            <TableCell className="font-medium">
                              {receipt.receiptNo}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(receipt.entryDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-foreground">
                                {item.productType.name}
                              </span>
                              {item.productSubType && (
                                <span className="text-muted-foreground ml-1 text-sm">
                                  ({item.productSubType.name})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₨ {item.totalPrice.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

          {/* Clearance Details Section */}
          {(reportType === 'both' || reportType === 'clearance') &&
            reportData.clearanceData?.receipts.length > 0 && (
              <Card>
                <CardHeader className="bg-background/50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-foreground/10 rounded-md">
                      <ArrowUp className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Clearance Details
                      </CardTitle>
                      <CardDescription>
                        Payments or items cleared
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clearance #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.clearanceData.receipts.map((receipt: any) =>
                        receipt.clearedItems.map((item: any, idx: number) => (
                          <TableRow key={`${receipt.id}-${idx}`}>
                            <TableCell className="font-medium">
                              {receipt.clearanceNo}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(receipt.clearanceDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-foreground">
                                {item.entryItem.productType.name}
                              </span>
                              {item.entryItem.productSubType && (
                                <span className="text-muted-foreground ml-1 text-sm">
                                  ({item.entryItem.productSubType.name})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.clearQuantity}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₨ {item.totalAmount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
        </div>
      ) : (
        // Empty State
        <div className="flex mt-3 flex-col items-center justify-center h-[400px] bg-background rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select a customer and filters above, then click "Generate Report" to
            view transactions.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper component for the top stats
function MetricCard({ title, value, description, icon, trend, color }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', color)}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
