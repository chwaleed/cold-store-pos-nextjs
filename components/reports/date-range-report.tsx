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
  X,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateOverallReportPDF } from '@/lib/pdf-generator.client';
import useStore from '@/app/(root)/(store)/store'; // Assuming you have this store like the previous file

export function DateRangeReport() {
  // Using store for consistency with your previous file
  const { types: productTypes, subType: productSubTypes } = useStore();
  const [filteredSubTypes, setFilteredSubTypes] = useState<any[]>([]);

  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [selectedSubType, setSelectedSubType] = useState<string | undefined>(
    undefined
  );
  const [period, setPeriod] = useState<string>('day');
  const [date, setDate] = useState<Date>(new Date());
  const [isDetailed, setIsDetailed] = useState<boolean>(false);
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
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        date: date.toISOString(),
        ...(selectedType && { productTypeId: selectedType }),
        ...(selectedSubType && { productSubTypeId: selectedSubType }),
      });

      const res = await fetch(`/api/reports/overall?${params}`);
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
    const productType = selectedType
      ? productTypes.find((t) => t.id.toString() === selectedType)?.name
      : undefined;
    const productSubType = selectedSubType
      ? productSubTypes.find((st) => st.id.toString() === selectedSubType)?.name
      : undefined;
    const filters = {
      period,
      date: date.toISOString(),
      productType,
      productSubType,
      detailed: isDetailed,
    };
    const doc = generateOverallReportPDF(reportData, filters);
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const productType = selectedType
      ? productTypes.find((t) => t.id.toString() === selectedType)?.name
      : undefined;
    const productSubType = selectedSubType
      ? productSubTypes.find((st) => st.id.toString() === selectedSubType)?.name
      : undefined;
    const filters = {
      period,
      date: date.toISOString(),
      productType,
      productSubType,
      detailed: isDetailed,
    };
    const doc = generateOverallReportPDF(reportData, filters);
    doc.download(`overall-report-${format(date, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    const productTypeName = selectedType
      ? productTypes.find((t) => t.id.toString() === selectedType)?.name
      : 'All Types';
    const productSubTypeName = selectedSubType
      ? productSubTypes.find((st) => st.id.toString() === selectedSubType)?.name
      : 'All Sub-Types';

    // Summary Sheet
    const summaryData = [
      ['OVERALL BUSINESS REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      [
        'Period',
        period === 'day' ? 'Daily' : period === 'month' ? 'Monthly' : 'Yearly',
      ],
      ['Date', format(date, 'PPP')],
      ['Product Type Filter', productTypeName],
      ['Product Sub-Type Filter', productSubTypeName],
      [],
      ['METRICS OVERVIEW'],
      ['Metric', 'Value'],
      [
        'Total Entry Amount',
        `₨ ${reportData.summary.totalEntryAmount.toFixed(2)}`,
      ],
      [
        'Total Entry Quantity',
        reportData.summary.totalEntryQuantity.toFixed(2),
      ],
      [
        'Total Clearance Amount',
        `₨ ${reportData.summary.totalClearanceAmount.toFixed(2)}`,
      ],
      [
        'Total Clearance Quantity',
        reportData.summary.totalClearanceQuantity.toFixed(2),
      ],
      [],
      ['PRODUCT BREAKDOWN'],
      [
        'Product Type',
        'Entry Qty',
        'Entry Amount (₨)',
        'Clearance Qty',
        'Clearance Amount (₨)',
      ],
    ];

    const allTypes = new Set([
      ...Object.keys(reportData.summary.entryByType),
      ...Object.keys(reportData.summary.clearanceByType),
    ]);

    allTypes.forEach((type) => {
      const entry = reportData.summary.entryByType[type] || {
        quantity: 0,
        amount: 0,
      };
      const clearance = reportData.summary.clearanceByType[type] || {
        quantity: 0,
        amount: 0,
      };
      summaryData.push([
        type,
        entry.quantity,
        entry.amount.toFixed(2),
        clearance.quantity,
        clearance.amount.toFixed(2),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Entries Sheet (only if detailed is checked)
    if (isDetailed && reportData.entries.length > 0) {
      const entryRows = [
        ['ENTRY RECEIPTS DETAIL'],
        [],
        [
          'Receipt No',
          'Customer',
          'Date',
          'Product Type',
          'Sub Type',
          'Quantity',
          'Unit Price',
          'Total Amount',
        ],
      ];
      reportData.entries.forEach((entry: any) => {
        entry.items.forEach((item: any) => {
          entryRows.push([
            entry.receiptNo,
            entry.customer.name,
            format(new Date(entry.entryDate), 'PP'),
            item.productType.name,
            item.productSubType?.name || '-',
            item.quantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalPrice || 0).toFixed(2),
          ]);
        });
      });
      const wsEntry = XLSX.utils.aoa_to_sheet(entryRows);
      wsEntry['!cols'] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsEntry, 'Entry Receipts');
    }

    // Clearance Sheet (only if detailed is checked)
    if (isDetailed && reportData.clearances.length > 0) {
      const clearRows = [
        ['CLEARANCE RECEIPTS DETAIL'],
        [],
        [
          'Clearance No',
          'Customer',
          'Date',
          'Product Type',
          'Sub Type',
          'Quantity',
          'Unit Price',
          'Total Amount',
        ],
      ];
      reportData.clearances.forEach((cl: any) => {
        cl.clearedItems.forEach((item: any) => {
          clearRows.push([
            cl.clearanceNo,
            cl.customer.name,
            format(new Date(cl.clearanceDate), 'PP'),
            item.entryItem.productType.name,
            item.entryItem.productSubType?.name || '-',
            item.clearQuantity,
            Number(item.unitPrice || 0).toFixed(2),
            Number(item.totalAmount || 0).toFixed(2),
          ]);
        });
      });
      const wsClear = XLSX.utils.aoa_to_sheet(clearRows);
      wsClear['!cols'] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsClear, 'Clearance Receipts');
    }

    // Room-wise Summary Sheet
    if (
      reportData.summary.entryByRoom ||
      reportData.summary.clearanceByRoom ||
      reportData.summary.currentStockByRoom
    ) {
      const roomRows = [
        ['ROOM-WISE SUMMARY'],
        [],
        [
          'Room Name',
          'Entry Qty',
          'Entry Amount (₨)',
          'Cleared Qty',
          'Cleared Amount (₨)',
          'Current Stock Qty',
        ],
      ];

      const allRooms = new Set([
        ...Object.keys(reportData.summary.entryByRoom || {}),
        ...Object.keys(reportData.summary.clearanceByRoom || {}),
        ...Object.keys(reportData.summary.currentStockByRoom || {}),
      ]);

      allRooms.forEach((room) => {
        const entry = reportData.summary.entryByRoom?.[room] || {
          quantity: 0,
          amount: 0,
        };
        const clearance = reportData.summary.clearanceByRoom?.[room] || {
          quantity: 0,
          amount: 0,
        };
        const current = reportData.summary.currentStockByRoom?.[room] || {
          quantity: 0,
        };

        roomRows.push([
          room,
          entry.quantity,
          entry.amount.toFixed(2),
          clearance.quantity,
          clearance.amount.toFixed(2),
          current.quantity,
        ]);
      });

      const wsRoom = XLSX.utils.aoa_to_sheet(roomRows);
      wsRoom['!cols'] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRoom, 'Room-wise Summary');
    }

    // Detailed Product Breakdown Sheet
    if (
      reportData.summary.detailedProductBreakdown &&
      reportData.summary.detailedProductBreakdown.length > 0
    ) {
      const productRows = [
        ['DETAILED PRODUCT BREAKDOWN'],
        [],
        [
          'Product Type',
          'Entry Quantity',
          'Cleared Quantity',
          'Remaining Quantity',
        ],
      ];

      reportData.summary.detailedProductBreakdown.forEach((item: any) => {
        const productName = item.productSubType
          ? `${item.productType} (${item.productSubType})`
          : item.productType;

        productRows.push([
          productName,
          item.entryQuantity,
          item.clearanceQuantity,
          item.currentQuantity,
        ]);
      });

      const wsProduct = XLSX.utils.aoa_to_sheet(productRows);
      wsProduct['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsProduct, 'Product Breakdown');
    }

    XLSX.writeFile(wb, `overall_report_${format(date, 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel exported');
  };

  return (
    <div className="flex flex-col mt-4 gap-6  mx-auto">
      {/* --- Header --- */}

      {/* --- Filters --- */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-blue-500" />
            Report Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Time Controls */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Time Period
              </Label>
              <div className="flex gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>

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
              </div>
            </div>

            {/* Product Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Product Type
                </Label>
                {selectedType && (
                  <span
                    onClick={() => setSelectedType(undefined)}
                    className="text-xs text-red-500 cursor-pointer hover:underline flex items-center"
                  >
                    Clear
                  </span>
                )}
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Sub Type
                </Label>
                {selectedSubType && (
                  <span
                    onClick={() => setSelectedSubType(undefined)}
                    className="text-xs text-red-500 cursor-pointer hover:underline"
                  >
                    Clear
                  </span>
                )}
              </div>
              <Select
                value={selectedSubType}
                onValueChange={setSelectedSubType}
                disabled={!selectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subtypes" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubTypes.map((subType) => (
                    <SelectItem key={subType.id} value={subType.id.toString()}>
                      {subType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Button and Options */}
            <div className="space-y-4">
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
                  Include Transaction Details
                </Label>
              </div>

              <Button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
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

      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        {reportData && (
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
        )}
      </div>

      {/* --- Report Content --- */}
      {reportData ? (
        <div
          ref={printRef}
          className="space-y-6 animate-in fade-in-50 duration-500"
        >
          {/* 1. Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Entry Amount"
              value={`₨ ${reportData.summary.totalEntryAmount.toFixed(2)}`}
              icon={<ArrowDownLeft className="text-blue-500" />}
              className="border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="Entry Quantity"
              value={reportData.summary.totalEntryQuantity.toFixed(2)}
              icon={<Package className="text-blue-500" />}
              className="border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="Clearance Amount"
              value={`₨ ${reportData.summary.totalClearanceAmount.toFixed(2)}`}
              icon={<ArrowUpRight className="text-emerald-500" />}
              className="border-l-4 border-l-emerald-500"
            />
            <MetricCard
              title="Clearance Quantity"
              value={reportData.summary.totalClearanceQuantity.toFixed(2)}
              icon={<Package className="text-emerald-500" />}
              className="border-l-4 border-l-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 2. Product Breakdown (Left/Top) */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Summary by Product Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right text-blue-600">
                          In
                        </TableHead>
                        <TableHead className="text-right text-emerald-600">
                          Out
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(
                        new Set([
                          ...Object.keys(reportData.summary.entryByType),
                          ...Object.keys(reportData.summary.clearanceByType),
                        ])
                      ).map((type) => {
                        const entry = reportData.summary.entryByType[type] || {
                          quantity: 0,
                          amount: 0,
                        };
                        const clearance = reportData.summary.clearanceByType[
                          type
                        ] || { quantity: 0, amount: 0 };
                        return (
                          <TableRow key={type}>
                            <TableCell className="font-medium">
                              {type}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {entry.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₨ {entry.amount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {clearance.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₨ {clearance.amount.toLocaleString()}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Room-wise Summary */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Summary by Room
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Room</TableHead>
                        <TableHead className="text-right text-blue-600">
                          Entry
                        </TableHead>
                        <TableHead className="text-right text-emerald-600">
                          Cleared
                        </TableHead>
                        <TableHead className="text-right text-orange-600">
                          Current
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(
                        new Set([
                          ...Object.keys(reportData.summary.entryByRoom || {}),
                          ...Object.keys(
                            reportData.summary.clearanceByRoom || {}
                          ),
                          ...Object.keys(
                            reportData.summary.currentStockByRoom || {}
                          ),
                        ])
                      ).map((room) => {
                        const entry = reportData.summary.entryByRoom?.[
                          room
                        ] || {
                          quantity: 0,
                          amount: 0,
                        };
                        const clearance = reportData.summary.clearanceByRoom?.[
                          room
                        ] || {
                          quantity: 0,
                          amount: 0,
                        };
                        const current = reportData.summary.currentStockByRoom?.[
                          room
                        ] || {
                          quantity: 0,
                        };
                        return (
                          <TableRow key={room}>
                            <TableCell className="font-medium">
                              {room}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {entry.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₨ {entry.amount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {clearance.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₨ {clearance.amount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium text-orange-600">
                                {current.quantity}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {Object.keys(reportData.summary.entryByRoom || {})
                        .length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-4 text-muted-foreground"
                          >
                            No room data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 3. Detailed Tabs (Bottom) */}
          </div>

          {/* Detailed Product Breakdown */}
          {reportData.summary.detailedProductBreakdown &&
            reportData.summary.detailedProductBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Detailed Product Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">
                            Product Type
                          </TableHead>
                          <TableHead className="text-right font-semibold text-blue-600">
                            Entry Qty
                          </TableHead>
                          <TableHead className="text-right font-semibold text-emerald-600">
                            Cleared Qty
                          </TableHead>
                          <TableHead className="text-right font-semibold text-orange-600">
                            Remaining Qty
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.summary.detailedProductBreakdown.map(
                          (item: any) => (
                            <TableRow key={item.key}>
                              <TableCell className="font-medium">
                                {item.productSubType ? (
                                  <>
                                    {item.productType}{' '}
                                    <span className="text-muted-foreground">
                                      ({item.productSubType})
                                    </span>
                                  </>
                                ) : (
                                  item.productType
                                )}
                              </TableCell>
                              <TableCell className="text-right text-blue-600 font-medium">
                                {item.entryQuantity}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 font-medium">
                                {item.clearanceQuantity}
                              </TableCell>
                              <TableCell className="text-right text-orange-600 font-medium">
                                {item.currentQuantity}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Transaction Details - Only show if detailed is checked */}
          {isDetailed && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="entries" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="entries">
                        Entries ({reportData.entries.length})
                      </TabsTrigger>
                      <TabsTrigger value="clearances">
                        Clearances ({reportData.clearances.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="entries"
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-background/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Receipt No</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">
                                Total Items
                              </TableHead>
                              <TableHead className="text-right">
                                Total Qty
                              </TableHead>
                              <TableHead className="text-right">
                                Total Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.entries.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-8 text-muted-foreground"
                                >
                                  No entries found
                                </TableCell>
                              </TableRow>
                            )}
                            {reportData.entries.map((entry: any) => {
                              const totalItems = entry.items.length;
                              const totalQty = entry.items.reduce(
                                (sum: number, item: any) => sum + item.quantity,
                                0
                              );
                              return (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-mono text-xs">
                                    {entry.receiptNo}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {entry.customer.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-xs">
                                    {format(new Date(entry.entryDate), 'PP')}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {totalItems}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {totalQty}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ₨ {entry.totalAmount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="clearances"
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-background/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Clearance No</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">
                                Total Items
                              </TableHead>
                              <TableHead className="text-right">
                                Total Qty
                              </TableHead>
                              <TableHead className="text-right">
                                Total Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.clearances.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-8 text-muted-foreground"
                                >
                                  No clearances found
                                </TableCell>
                              </TableRow>
                            )}
                            {reportData.clearances.map((clearance: any) => {
                              const totalItems = clearance.clearedItems.length;
                              const totalQty = clearance.clearedItems.reduce(
                                (sum: number, item: any) =>
                                  sum + item.clearQuantity,
                                0
                              );
                              return (
                                <TableRow key={clearance.id}>
                                  <TableCell className="font-mono text-xs">
                                    {clearance.clearanceNo}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {clearance.customer.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(clearance.clearanceDate),
                                      'PP'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {totalItems}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {totalQty}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ₨ {clearance.totalAmount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[400px] bg-background/50 rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select parameters above and click "Generate Report" to see business
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
