'use client';

import { useState, useRef } from 'react';
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

import { format } from 'date-fns';
import { Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { YearMonthPicker } from '@/components/ui/year-month-picker';
import { generateAuditReportPDF } from '@/lib/pdf-generator';

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
    if (!reportData) {
      toast.error('No report data to print');
      return;
    }
    const doc = generateAuditReportPDF(reportData);
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) {
      toast.error('No report data to download');
      return;
    }
    const doc = generateAuditReportPDF(reportData);
    doc.download(
      `audit_report_${reportData.period.year}_${reportData.period.month || 'full'}.pdf`
    );
    toast.success('PDF downloaded successfully');
  };

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    const auditData = [
      ['AUDIT REPORT'],
      ['Period', reportData.period.type],
      ['Year', reportData.period.year],
      ...(reportData.period.month ? [['Month', reportData.period.month]] : []),
      ['Start Date', format(new Date(reportData.period.startDate), 'PPP')],
      ['End Date', format(new Date(reportData.period.endDate), 'PPP')],
      [],
      ['ENTRY SUMMARY'],
      ['Total Entry Amount', reportData.entry.totalAmount],
      ['Total Entry Quantity', reportData.entry.totalQuantity],
      ['Total Entry Receipts', reportData.entry.totalReceipts],
      [],
      ['CLEARANCE SUMMARY'],
      ['Total Clearance Amount', reportData.clearance.totalAmount],
      ['Total Clearance Quantity', reportData.clearance.totalQuantity],
      ['Total Clearance Receipts', reportData.clearance.totalReceipts],
      [],
      ['EXPENSE SUMMARY'],
      ['Total Expenses', reportData.expenses.total],
      ['Number of Expenses', reportData.expenses.count],
      [],
      ['Expenses by Category'],
      ['Category', 'Amount'],
    ];

    Object.entries(reportData.expenses.byCategory).forEach(
      ([category, amount]) => {
        auditData.push([category, amount as number]);
      }
    );

    auditData.push([]);
    auditData.push(['INVENTORY SUMMARY']);
    auditData.push(['Total Inventory Value', reportData.inventory.totalValue]);
    auditData.push([
      'Total Inventory Quantity',
      reportData.inventory.totalQuantity,
    ]);
    auditData.push(['Number of Items', reportData.inventory.itemCount]);
    auditData.push([]);
    auditData.push(['FINANCIAL SUMMARY']);
    auditData.push(['Total Revenue', reportData.financial.totalRevenue]);
    auditData.push(['Total Costs', reportData.financial.totalCosts]);
    auditData.push(['Profit/Loss', reportData.financial.profitLoss]);
    auditData.push(['Profit Margin %', reportData.financial.profitMargin]);
    auditData.push([
      'Payments Received',
      reportData.financial.paymentsReceived,
    ]);
    auditData.push([
      'Outstanding Balance',
      reportData.financial.outstandingBalance,
    ]);
    auditData.push([]);
    auditData.push(['CUSTOMER STATISTICS']);
    auditData.push(['Active Customers', reportData.customers.activeCount]);
    auditData.push([]);
    auditData.push(['ROOM UTILIZATION']);
    auditData.push([
      'Room',
      'Type',
      'Capacity',
      'Current Items',
      'Current Quantity',
    ]);

    reportData.rooms.utilization.forEach((room: any) => {
      auditData.push([
        room.name,
        room.type,
        room.capacity || 'N/A',
        room.currentItems,
        room.currentQuantity,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(auditData);
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Report');

    const fileName = `audit_report_${reportData.period.year}_${reportData.period.month || 'full'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <YearMonthPicker
              value={date}
              onChange={setDate}
              mode={period as 'year' | 'month'}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Audit Report'}
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
              <CardTitle>Audit Report - {reportData.period.year}</CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>
                  Period:{' '}
                  {reportData.period.type === 'month'
                    ? `${format(new Date(reportData.period.startDate), 'MMMM yyyy')}`
                    : reportData.period.year}
                </p>
                <p>
                  {format(new Date(reportData.period.startDate), 'PPP')} to{' '}
                  {format(new Date(reportData.period.endDate), 'PPP')}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Financial Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold">
                      ₨ {reportData.financial.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Costs</p>
                    <p className="text-2xl font-bold">
                      ₨ {reportData.financial.totalCosts.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-4 rounded-lg',
                      reportData.financial.profitLoss >= 0
                        ? 'bg-green-50'
                        : 'bg-orange-50'
                    )}
                  >
                    <p className="text-sm text-muted-foreground">Profit/Loss</p>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          reportData.financial.profitLoss >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        ₨ {Math.abs(reportData.financial.profitLoss).toFixed(2)}
                      </p>
                      {reportData.financial.profitLoss >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Margin: {reportData.financial.profitMargin}%
                    </p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Payments Received
                    </p>
                    <p className="text-2xl font-bold">
                      ₨ {reportData.financial.paymentsReceived.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Outstanding Balance
                    </p>
                    <p className="text-2xl font-bold">
                      ₨ {reportData.financial.outstandingBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Active Customers
                    </p>
                    <p className="text-2xl font-bold">
                      {reportData.customers.activeCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entry Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Entry Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold">
                      ₨ {reportData.entry.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Quantity
                    </p>
                    <p className="text-xl font-bold">
                      {reportData.entry.totalQuantity.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Receipts</p>
                    <p className="text-xl font-bold">
                      {reportData.entry.totalReceipts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clearance Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Clearance Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold">
                      ₨ {reportData.clearance.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Quantity
                    </p>
                    <p className="text-xl font-bold">
                      {reportData.clearance.totalQuantity.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Receipts</p>
                    <p className="text-xl font-bold">
                      {reportData.clearance.totalReceipts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Expenses Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Expenses
                    </p>
                    <p className="text-xl font-bold">
                      ₨ {reportData.expenses.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Number of Expenses
                    </p>
                    <p className="text-xl font-bold">
                      {reportData.expenses.count}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.expenses.byCategory).map(
                        ([category, amount]) => (
                          <tr key={category} className="border-t">
                            <td className="p-2">{category}</td>
                            <td className="p-2 text-right">
                              ₨ {(amount as number).toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventory Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Current Inventory
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">
                      ₨ {reportData.inventory.totalValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Quantity
                    </p>
                    <p className="text-xl font-bold">
                      {reportData.inventory.totalQuantity.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-lime-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Items in Stock
                    </p>
                    <p className="text-xl font-bold">
                      {reportData.inventory.itemCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Utilization */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Room Utilization</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Room</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-right">Capacity</th>
                        <th className="p-2 text-right">Current Items</th>
                        <th className="p-2 text-right">Current Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rooms.utilization.map((room: any) => (
                        <tr key={room.name} className="border-t">
                          <td className="p-2 font-medium">{room.name}</td>
                          <td className="p-2">
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs',
                                room.type === 'COLD'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              )}
                            >
                              {room.type}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            {room.capacity || 'N/A'}
                          </td>
                          <td className="p-2 text-right">
                            {room.currentItems}
                          </td>
                          <td className="p-2 text-right">
                            {room.currentQuantity.toFixed(2)}
                          </td>
                        </tr>
                      ))}
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
