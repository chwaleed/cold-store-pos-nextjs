'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';
import { CalendarIcon, Download, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateOverallReportPDF } from '@/lib/pdf-generator';

interface ProductType {
  id: number;
  name: string;
}

interface ProductSubType {
  id: number;
  name: string;
  productTypeId: number;
}

export function DateRangeReport() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productSubTypes, setProductSubTypes] = useState<ProductSubType[]>([]);
  const [filteredSubTypes, setFilteredSubTypes] = useState<ProductSubType[]>(
    []
  );

  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [selectedSubType, setSelectedSubType] = useState<string | undefined>(
    undefined
  );
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
    if (!reportData) {
      toast.error('Please generate report first');
      return;
    }

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
    };

    const doc = generateOverallReportPDF(reportData, filters);
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) {
      toast.error('Please generate report first');
      return;
    }

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
    };

    const doc = generateOverallReportPDF(reportData, filters);
    doc.download(`overall-report-${format(date, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Overall Business Report'],
      ['Period', period],
      ['Date', format(date, 'PPP')],
      [],
      ['ENTRY SUMMARY'],
      ['Total Amount', reportData.summary.totalEntryAmount],
      ['Total Quantity', reportData.summary.totalEntryQuantity],
      [],
      ['CLEARANCE SUMMARY'],
      ['Total Amount', reportData.summary.totalClearanceAmount],
      ['Total Quantity', reportData.summary.totalClearanceQuantity],
      [],
      ['BY PRODUCT TYPE'],
      [
        'Type',
        'Entry Qty',
        'Entry Amount',
        'Clearance Qty',
        'Clearance Amount',
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
        entry.amount,
        clearance.quantity,
        clearance.amount,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Entries Sheet
    if (reportData.entries.length > 0) {
      const entryData = [
        [
          'Receipt No',
          'Customer',
          'Date',
          'Product Type',
          'Quantity',
          'Amount',
        ],
      ];

      reportData.entries.forEach((entry: any) => {
        entry.items.forEach((item: any) => {
          entryData.push([
            entry.receiptNo,
            entry.customer.name,
            format(new Date(entry.entryDate), 'PP'),
            `${item.productType.name}${item.productSubType ? ` - ${item.productSubType.name}` : ''}`,
            item.quantity,
            item.totalPrice,
          ]);
        });
      });

      const wsEntry = XLSX.utils.aoa_to_sheet(entryData);
      XLSX.utils.book_append_sheet(wb, wsEntry, 'Entries');
    }

    // Clearances Sheet
    if (reportData.clearances.length > 0) {
      const clearanceData = [
        [
          'Clearance No',
          'Customer',
          'Date',
          'Product Type',
          'Quantity',
          'Amount',
        ],
      ];

      reportData.clearances.forEach((clearance: any) => {
        clearance.clearedItems.forEach((item: any) => {
          clearanceData.push([
            clearance.clearanceNo,
            clearance.customer.name,
            format(new Date(clearance.clearanceDate), 'PP'),
            `${item.entryItem.productType.name}${item.entryItem.productSubType ? ` - ${item.entryItem.productSubType.name}` : ''}`,
            item.clearQuantity,
            item.totalAmount,
          ]);
        });
      });

      const wsClearance = XLSX.utils.aoa_to_sheet(clearanceData);
      XLSX.utils.book_append_sheet(wb, wsClearance, 'Clearances');
    }

    const fileName = `overall_report_${period}_${format(date, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Overall Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Type (Optional)</Label>
                {selectedType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedType(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product SubType (Optional)</Label>
                {selectedSubType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedSubType(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={selectedSubType}
                onValueChange={setSelectedSubType}
                disabled={!selectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subtypes" />
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
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {reportData && (
              <>
                <Button onClick={downloadPDF} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={exportToExcel} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div ref={printRef} className="print:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Overall Business Report</CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>
                  Period: {period} - {format(date, 'PPP')}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Entry Amount</p>
                  <p className="text-2xl font-bold">
                    ₨ {reportData.summary.totalEntryAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Entry Quantity
                  </p>
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalEntryQuantity.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Clearance Amount
                  </p>
                  <p className="text-2xl font-bold">
                    ₨ {reportData.summary.totalClearanceAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Clearance Quantity
                  </p>
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalClearanceQuantity.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Summary by Product Type
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Product Type</th>
                        <th className="p-2 text-right">Entry Qty</th>
                        <th className="p-2 text-right">Entry Amount</th>
                        <th className="p-2 text-right">Clearance Qty</th>
                        <th className="p-2 text-right">Clearance Amount</th>
                      </tr>
                    </thead>
                    <tbody>
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
                          <tr key={type} className="border-t">
                            <td className="p-2 font-medium">{type}</td>
                            <td className="p-2 text-right">
                              {entry.quantity.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              ₨ {entry.amount.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              {clearance.quantity.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              ₨ {clearance.amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Entry Details ({reportData.entries.length} receipts)
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Receipt No</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.entries.map((entry: any) =>
                        entry.items.map((item: any, idx: number) => (
                          <tr key={`${entry.id}-${idx}`} className="border-t">
                            <td className="p-2">{entry.receiptNo}</td>
                            <td className="p-2">{entry.customer.name}</td>
                            <td className="p-2">
                              {format(new Date(entry.entryDate), 'PP')}
                            </td>
                            <td className="p-2">
                              {item.productType.name}
                              {item.productSubType &&
                                ` - ${item.productSubType.name}`}
                            </td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">
                              ₨ {item.totalPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Clearance Details ({reportData.clearances.length} receipts)
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Clearance No</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.clearances.map((clearance: any) =>
                        clearance.clearedItems.map((item: any, idx: number) => (
                          <tr
                            key={`${clearance.id}-${idx}`}
                            className="border-t"
                          >
                            <td className="p-2">{clearance.clearanceNo}</td>
                            <td className="p-2">{clearance.customer.name}</td>
                            <td className="p-2">
                              {format(new Date(clearance.clearanceDate), 'PP')}
                            </td>
                            <td className="p-2">
                              {item.entryItem.productType.name}
                              {item.entryItem.productSubType &&
                                ` - ${item.entryItem.productSubType.name}`}
                            </td>
                            <td className="p-2 text-right">
                              {item.clearQuantity}
                            </td>
                            <td className="p-2 text-right">
                              ₨ {item.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
