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
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [isDetailed, setIsDetailed] = useState<boolean>(true);
  const [markaSearch, setMarkaSearch] = useState<string>('');
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
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        detailed: isDetailed.toString(),
        ...(selectedType && { productTypeId: selectedType }),
        ...(selectedSubType && { productSubTypeId: selectedSubType }),
        ...(markaSearch.trim() && { marka: markaSearch.trim() }),
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
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      reportType,
      detailed: isDetailed,
    });
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = generateCustomerReportPDF(reportData, {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      reportType,
      detailed: isDetailed,
    });
    doc.download(
      `customer_report_${reportData.customer.name}_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.pdf`
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
      ['Date Range', `${format(fromDate, 'PPP')} - ${format(toDate, 'PPP')}`],
      ['Report Type', isDetailed ? 'Detailed' : 'Summary'],
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

    // Marka Summary Sheets (if marka search is used)
    if (markaSearch) {
      // Entry Marka Summary
      if (reportData.entryMarkaData && reportData.entryMarkaData.length > 0) {
        const entryMarkaSheetData = [
          ['ENTRY MARKA SUMMARY'],
          [],
          ['Customer', 'Marka', 'Total Items'],
        ];

        reportData.entryMarkaData.forEach((item: any) => {
          entryMarkaSheetData.push([
            reportData.customer.name,
            item.marka,
            item.totalQuantity,
          ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(entryMarkaSheetData);
        ws2['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Entry Marka Summary');
      }

      // Clearance Marka Summary
      if (
        reportData.clearanceMarkaData &&
        reportData.clearanceMarkaData.length > 0
      ) {
        const clearanceMarkaSheetData = [
          ['CLEARANCE MARKA SUMMARY'],
          [],
          ['Customer', 'Marka', 'Total Items'],
        ];

        reportData.clearanceMarkaData.forEach((item: any) => {
          clearanceMarkaSheetData.push([
            reportData.customer.name,
            item.marka,
            item.totalQuantity,
          ]);
        });

        const ws3 = XLSX.utils.aoa_to_sheet(clearanceMarkaSheetData);
        ws3['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Clearance Marka Summary');
      }

      // Current Stock Marka Summary
      if (
        reportData.currentStockMarkaData &&
        reportData.currentStockMarkaData.length > 0
      ) {
        const currentStockMarkaSheetData = [
          ['CURRENT STOCK MARKA SUMMARY'],
          [],
          ['Customer', 'Marka', 'Total Items'],
        ];

        reportData.currentStockMarkaData.forEach((item: any) => {
          currentStockMarkaSheetData.push([
            reportData.customer.name,
            item.marka,
            item.totalQuantity,
          ]);
        });

        const ws4 = XLSX.utils.aoa_to_sheet(currentStockMarkaSheetData);
        ws4['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Current Stock Marka');
      }
    }

    // Product Summary Sheets (if not detailed)
    if (!isDetailed) {
      // Entry Summary
      if (
        reportData.entrySummaryData &&
        reportData.entrySummaryData.length > 0
      ) {
        const entrySummarySheetData = [
          ['ENTRY SUMMARY'],
          [],
          ['Customer', 'Product Type', 'Total Items'],
        ];

        reportData.entrySummaryData.forEach((item: any) => {
          entrySummarySheetData.push([
            reportData.customer.name,
            item.subType
              ? `${item.productType} (${item.subType})`
              : item.productType,
            item.totalQuantity,
          ]);
        });

        const ws5 = XLSX.utils.aoa_to_sheet(entrySummarySheetData);
        ws5['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws5, 'Entry Summary');
      }

      // Clearance Summary
      if (
        reportData.clearanceSummaryData &&
        reportData.clearanceSummaryData.length > 0
      ) {
        const clearanceSummarySheetData = [
          ['CLEARANCE SUMMARY'],
          [],
          ['Customer', 'Product Type', 'Total Items'],
        ];

        reportData.clearanceSummaryData.forEach((item: any) => {
          clearanceSummarySheetData.push([
            reportData.customer.name,
            item.subType
              ? `${item.productType} (${item.subType})`
              : item.productType,
            item.totalQuantity,
          ]);
        });

        const ws6 = XLSX.utils.aoa_to_sheet(clearanceSummarySheetData);
        ws6['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws6, 'Clearance Summary');
      }

      // Current Stock Summary
      if (
        reportData.currentStockSummaryData &&
        reportData.currentStockSummaryData.length > 0
      ) {
        const currentStockSummarySheetData = [
          ['CURRENT STOCK SUMMARY'],
          [],
          ['Customer', 'Product Type', 'Total Items'],
        ];

        reportData.currentStockSummaryData.forEach((item: any) => {
          currentStockSummarySheetData.push([
            reportData.customer.name,
            item.subType
              ? `${item.productType} (${item.subType})`
              : item.productType,
            item.totalQuantity,
          ]);
        });

        const ws7 = XLSX.utils.aoa_to_sheet(currentStockSummarySheetData);
        ws7['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws7, 'Current Stock Summary');
      }
    }

    // Entry Receipts Sheet (if detailed)
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
          'Marka',
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
            item.marka || '-',
            item.quantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalPrice || 0).toFixed(2),
          ]);
        });
      });

      const ws8 = XLSX.utils.aoa_to_sheet(entryData);
      ws8['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws8, 'Entry Receipts');
    }

    // Clearance Receipts Sheet (if detailed)
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
          'Marka',
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
            item.entryItem.marka || '-',
            item.clearQuantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalAmount || 0).toFixed(2),
          ]);
        });
      });

      const ws9 = XLSX.utils.aoa_to_sheet(clearanceData);
      ws9['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws9, 'Clearance Receipts');
    }

    XLSX.writeFile(
      wb,
      `customer_report_${reportData.customer.name}_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.xlsx`
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
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

            <div className="space-y-4">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detailed"
                  checked={isDetailed}
                  onCheckedChange={(checked) => setIsDetailed(checked === true)}
                />
                <Label
                  htmlFor="detailed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Detailed Report
                </Label>
              </div>
            </div>

            {/* Row 2: Advanced/Product Filters */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Product Filter
                </Label>
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
                  disabled={!selectedType || filteredSubTypes.length == 0}
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
            <div className="space-y-2">
              <div className="flex  justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Marka Search
                </Label>
                {(selectedType || selectedSubType || markaSearch) && (
                  <span
                    className="text-xs text-red-500 cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedType(undefined);
                      setSelectedSubType(undefined);
                      setMarkaSearch('');
                    }}
                  >
                    Clear All
                  </span>
                )}
              </div>
              <Input
                placeholder="Search by marka..."
                value={markaSearch}
                onChange={(e) => setMarkaSearch(e.target.value)}
                className="w-full"
              />
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
                  {format(fromDate, 'MMM dd, yyyy')} -{' '}
                  {format(toDate, 'MMM dd, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isDetailed ? 'Detailed View' : 'Summary View'}
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
          {isDetailed &&
            (reportType === 'both' || reportType === 'entry') &&
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
                        <TableHead>Marka</TableHead>
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
                            <TableCell className="text-muted-foreground">
                              {item.marka || '-'}
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
          {isDetailed &&
            (reportType === 'both' || reportType === 'clearance') &&
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
                        <TableHead>Marka</TableHead>
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
                            <TableCell className="text-muted-foreground">
                              {item.entryItem.marka || '-'}
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

          {/* Marka Summary Sections - When marka search is used */}
          {markaSearch && (
            <>
              {/* Entry Marka Summary */}
              {reportData.entryMarkaData &&
                reportData.entryMarkaData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <ArrowDown className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Entry Marka Summary
                          </CardTitle>
                          <CardDescription>
                            Total entry quantities by marka matching "
                            {markaSearch}"
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Marka</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.entryMarkaData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.marka}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Clearance Marka Summary */}
              {reportData.clearanceMarkaData &&
                reportData.clearanceMarkaData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <ArrowUp className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Clearance Marka Summary
                          </CardTitle>
                          <CardDescription>
                            Total clearance quantities by marka matching "
                            {markaSearch}"
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Marka</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.clearanceMarkaData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.marka}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Current Stock Marka Summary */}
              {reportData.currentStockMarkaData &&
                reportData.currentStockMarkaData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <Search className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Current Stock Marka Summary
                          </CardTitle>
                          <CardDescription>
                            Remaining stock by marka matching "{markaSearch}"
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Marka</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.currentStockMarkaData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.marka}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
            </>
          )}

          {/* Product Summary Sections - When not detailed */}
          {!isDetailed && (
            <>
              {/* Entry Summary */}
              {reportData.entrySummaryData &&
                reportData.entrySummaryData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <ArrowDown className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Entry Summary
                          </CardTitle>
                          <CardDescription>
                            Total entry quantities by product type and subtype
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Product Type</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.entrySummaryData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.productType}
                                  </span>
                                  {item.subType && (
                                    <span className="text-muted-foreground ml-1 text-sm">
                                      ({item.subType})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Clearance Summary */}
              {reportData.clearanceSummaryData &&
                reportData.clearanceSummaryData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <ArrowUp className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Clearance Summary
                          </CardTitle>
                          <CardDescription>
                            Total clearance quantities by product type and
                            subtype
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Product Type</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.clearanceSummaryData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.productType}
                                  </span>
                                  {item.subType && (
                                    <span className="text-muted-foreground ml-1 text-sm">
                                      ({item.subType})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Current Stock Summary */}
              {reportData.currentStockSummaryData &&
                reportData.currentStockSummaryData.length > 0 && (
                  <Card>
                    <CardHeader className="bg-background/50 rounded-2xl border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-foreground/10 rounded-md">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Current Stock Summary
                          </CardTitle>
                          <CardDescription>
                            Remaining stock by product type and subtype
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Product Type</TableHead>
                            <TableHead className="text-right">
                              Total Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.currentStockSummaryData.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {reportData.customer.name}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">
                                    {item.productType}
                                  </span>
                                  {item.subType && (
                                    <span className="text-muted-foreground ml-1 text-sm">
                                      ({item.subType})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalQuantity}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
            </>
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
