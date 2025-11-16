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
import { generateCustomerReportPDF } from '@/lib/pdf-generator';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import useStore from '@/app/(root)/(store)/store';

export function DailyReport() {
  const { types: productTypes, subType: productSubTypes } = useStore();
  const [filteredSubTypes, setFilteredSubTypes] = useState<any[]>([]);

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
    if (!reportData) {
      toast.error('No report data to print');
      return;
    }
    const doc = generateCustomerReportPDF(reportData, {
      period,
      date: date.toISOString(),
      reportType,
    });
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) {
      toast.error('No report data to download');
      return;
    }
    const doc = generateCustomerReportPDF(reportData, {
      period,
      date: date.toISOString(),
      reportType,
    });
    doc.download(
      `customer_report_${reportData.customer.name}_${format(date, 'yyyy-MM-dd')}.pdf`
    );
    toast.success('PDF downloaded successfully');
  };

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Customer Info Sheet
    const customerInfo = [
      ['Customer Report'],
      ['Customer Name', reportData.customer.name],
      ['Phone', reportData.customer.phone || 'N/A'],
      ['Address', reportData.customer.address || 'N/A'],
      ['Report Period', period],
      ['Date', format(date, 'PPP')],
      ['Report Type', reportType.toUpperCase()],
      [],
    ];

    // Entry Data
    if (reportData.entryData) {
      customerInfo.push(['ENTRY SUMMARY']);
      customerInfo.push(['Total Amount', reportData.entryData.totalAmount]);
      customerInfo.push(['Total Quantity', reportData.entryData.totalQuantity]);
      customerInfo.push([
        'Total Receipts',
        reportData.entryData.receipts.length,
      ]);
      customerInfo.push([]);

      if (reportData.entryData.receipts.length > 0) {
        customerInfo.push(['Entry Details']);
        customerInfo.push([
          'Receipt No',
          'Date',
          'Product Type',
          'Quantity',
          'Amount',
        ]);

        reportData.entryData.receipts.forEach((receipt: any) => {
          receipt.items.forEach((item: any) => {
            customerInfo.push([
              receipt.receiptNo,
              format(new Date(receipt.entryDate), 'PP'),
              item.productType.name,
              item.quantity,
              item.totalPrice,
            ]);
          });
        });
      }
    }

    // Clearance Data
    if (reportData.clearanceData) {
      customerInfo.push([]);
      customerInfo.push(['CLEARANCE SUMMARY']);
      customerInfo.push(['Total Amount', reportData.clearanceData.totalAmount]);
      customerInfo.push([
        'Total Quantity',
        reportData.clearanceData.totalQuantity,
      ]);
      customerInfo.push([
        'Total Receipts',
        reportData.clearanceData.receipts.length,
      ]);
      customerInfo.push([]);

      if (reportData.clearanceData.receipts.length > 0) {
        customerInfo.push(['Clearance Details']);
        customerInfo.push([
          'Clearance No',
          'Date',
          'Product Type',
          'Quantity',
          'Amount',
        ]);

        reportData.clearanceData.receipts.forEach((receipt: any) => {
          receipt.clearedItems.forEach((item: any) => {
            customerInfo.push([
              receipt.clearanceNo,
              format(new Date(receipt.clearanceDate), 'PP'),
              item.entryItem.productType.name,
              item.clearQuantity,
              item.totalAmount,
            ]);
          });
        });
      }
    }

    // Balance
    customerInfo.push([]);
    customerInfo.push(['Current Balance', reportData.balance]);

    const ws = XLSX.utils.aoa_to_sheet(customerInfo);
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');

    const fileName = `customer_report_${reportData.customer.name}_${format(date, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Customer Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerSearchSelect
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
                placeholder="Select customer"
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Only</SelectItem>
                  <SelectItem value="clearance">Clearance Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
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

            {period !== 'lifetime' && (
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
            )}
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
                  Print PDF
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
              <CardTitle>
                Customer Report - {reportData.customer.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>Phone: {reportData.customer.phone || 'N/A'}</p>
                <p>
                  Period: {period} -{' '}
                  {period !== 'lifetime' && format(date, 'PPP')}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportData.entryData && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Entry Summary</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold">
                        ₨ {reportData.entryData.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Quantity
                      </p>
                      <p className="text-2xl font-bold">
                        {reportData.entryData.totalQuantity.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Receipts</p>
                      <p className="text-2xl font-bold">
                        {reportData.entryData.receipts.length}
                      </p>
                    </div>
                  </div>

                  {reportData.entryData.receipts.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 text-left">Receipt No</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Product Type</th>
                            <th className="p-2 text-right">Quantity</th>
                            <th className="p-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.entryData.receipts.map((receipt: any) =>
                            receipt.items.map((item: any, idx: number) => (
                              <tr
                                key={`${receipt.id}-${idx}`}
                                className="border-t"
                              >
                                <td className="p-2">{receipt.receiptNo}</td>
                                <td className="p-2">
                                  {format(new Date(receipt.entryDate), 'PP')}
                                </td>
                                <td className="p-2">
                                  {item.productType.name}
                                  {item.productSubType &&
                                    ` - ${item.productSubType.name}`}
                                </td>
                                <td className="p-2 text-right">
                                  {item.quantity}
                                </td>
                                <td className="p-2 text-right">
                                  ₨ {item.totalPrice.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {reportData.clearanceData && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Clearance Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold">
                        ₨ {reportData.clearanceData.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Quantity
                      </p>
                      <p className="text-2xl font-bold">
                        {reportData.clearanceData.totalQuantity.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Receipts</p>
                      <p className="text-2xl font-bold">
                        {reportData.clearanceData.receipts.length}
                      </p>
                    </div>
                  </div>

                  {reportData.clearanceData.receipts.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 text-left">Clearance No</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Product Type</th>
                            <th className="p-2 text-right">Quantity</th>
                            <th className="p-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.clearanceData.receipts.map(
                            (receipt: any) =>
                              receipt.clearedItems.map(
                                (item: any, idx: number) => (
                                  <tr
                                    key={`${receipt.id}-${idx}`}
                                    className="border-t"
                                  >
                                    <td className="p-2">
                                      {receipt.clearanceNo}
                                    </td>
                                    <td className="p-2">
                                      {format(
                                        new Date(receipt.clearanceDate),
                                        'PP'
                                      )}
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
                                )
                              )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Current Balance</h3>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      reportData.balance > 0
                        ? 'text-red-600'
                        : reportData.balance < 0
                          ? 'text-green-600'
                          : ''
                    )}
                  >
                    ₨ {Math.abs(reportData.balance).toFixed(2)}{' '}
                    {reportData.balance > 0
                      ? '(Receivable)'
                      : reportData.balance < 0
                        ? '(Payable)'
                        : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
