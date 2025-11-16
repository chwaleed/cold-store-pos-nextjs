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
import { generateExpenseReportPDF } from '@/lib/pdf-generator';

interface ExpenseCategory {
  id: number;
  name: string;
}

export function ExpenseReport() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [period, setPeriod] = useState<string>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/expenses/category');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        date: date.toISOString(),
        ...(selectedCategory && { categoryId: selectedCategory }),
      });

      const res = await fetch(`/api/reports/expenses?${params}`);
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
    const doc = generateExpenseReportPDF(reportData, {
      period,
      date: date.toISOString(),
    });
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) {
      toast.error('No report data to download');
      return;
    }
    const doc = generateExpenseReportPDF(reportData, {
      period,
      date: date.toISOString(),
    });
    doc.download(`expense_report_${period}_${format(date, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Expense Report'],
      ['Period', period],
      ['Date', format(date, 'PPP')],
      [],
      ['SUMMARY'],
      ['Total Expenses', reportData.summary.grandTotal],
      ['Number of Expenses', reportData.summary.count],
      [],
      ['BY CATEGORY'],
      ['Category', 'Amount'],
    ];

    Object.entries(reportData.summary.totalByCategory).forEach(
      ([category, amount]) => {
        summaryData.push([category, amount as number]);
      }
    );

    summaryData.push([]);
    summaryData.push(['EXPENSE DETAILS']);
    summaryData.push(['Date', 'Category', 'Amount', 'Description']);

    reportData.expenses.forEach((expense: any) => {
      summaryData.push([
        format(new Date(expense.date), 'PP'),
        expense.category.name,
        expense.amount,
        expense.description || '',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    const fileName = `expense_report_${period}_${format(date, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expense Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period !== 'all' && (
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category (Optional)</Label>
                {selectedCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
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
              <CardTitle>Expense Report</CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>
                  Period: {period}{' '}
                  {period !== 'all' && `- ${format(date, 'PPP')}`}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold">
                    ₨ {reportData.summary.grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Number of Expenses
                  </p>
                  <p className="text-2xl font-bold">
                    {reportData.summary.count}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Expenses by Category
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.summary.totalByCategory).map(
                        ([category, amount]) => (
                          <tr key={category} className="border-t">
                            <td className="p-2 font-medium">{category}</td>
                            <td className="p-2 text-right">
                              ₨ {(amount as number).toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              {(
                                ((amount as number) /
                                  reportData.summary.grandTotal) *
                                100
                              ).toFixed(1)}
                              %
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Expense Details</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expenses.map((expense: any) => (
                        <tr key={expense.id} className="border-t">
                          <td className="p-2">
                            {format(new Date(expense.date), 'PP')}
                          </td>
                          <td className="p-2">{expense.category.name}</td>
                          <td className="p-2 text-right">
                            ₨ {expense.amount.toFixed(2)}
                          </td>
                          <td className="p-2">{expense.description || '-'}</td>
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
