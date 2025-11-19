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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  Printer,
  X,
  Search,
  Filter,
  PieChart,
  Receipt,
  Wallet,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateExpenseReportPDF } from '@/lib/pdf-generator.client';

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
    if (!reportData) return;
    const doc = generateExpenseReportPDF(reportData, {
      period,
      date: date.toISOString(),
    });
    doc.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = generateExpenseReportPDF(reportData, {
      period,
      date: date.toISOString(),
    });
    doc.download(`expense_report_${period}_${format(date, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    const categoryName = selectedCategory
      ? categories.find((c) => c.id.toString() === selectedCategory)?.name
      : 'All Categories';

    // Summary Sheet
    const summaryData = [
      ['EXPENSE REPORT'],
      ['Generated On', format(new Date(), 'PPP p')],
      [
        'Period',
        period === 'day'
          ? 'Daily'
          : period === 'month'
            ? 'Monthly'
            : period === 'year'
              ? 'Yearly'
              : 'All Time',
      ],
      ['Date', period === 'all' ? 'All Time' : format(date, 'PPP')],
      ['Category Filter', categoryName],
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Expenses', `₨ ${reportData.summary.grandTotal.toFixed(2)}`],
      ['Number of Expenses', reportData.summary.count],
      [],
      ['EXPENSES BY CATEGORY'],
      ['Category', 'Amount (₨)', 'Percentage'],
    ];

    Object.entries(reportData.summary.totalByCategory).forEach(
      ([category, amount]) => {
        const percentage = (
          ((amount as number) / reportData.summary.grandTotal) *
          100
        ).toFixed(2);
        summaryData.push([
          category,
          (amount as number).toFixed(2),
          `${percentage}%`,
        ]);
      }
    );

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Expense Details Sheet
    if (reportData.expenses && reportData.expenses.length > 0) {
      const expenseData = [
        ['EXPENSE DETAILS'],
        [],
        ['Date', 'Category', 'Amount (₨)', 'Description'],
      ];

      reportData.expenses.forEach((expense: any) => {
        expenseData.push([
          format(new Date(expense.date), 'PP'),
          expense.category.name,
          expense.amount.toFixed(2),
          expense.description || '-',
        ]);
      });

      // Add totals row
      expenseData.push(
        [],
        ['TOTAL', '', reportData.summary.grandTotal.toFixed(2), '']
      );

      const ws2 = XLSX.utils.aoa_to_sheet(expenseData);
      ws2['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Expense Details');
    }

    XLSX.writeFile(
      wb,
      `expense_report_${period}_${format(date, 'yyyy-MM-dd')}.xlsx`
    );
    toast.success('Excel exported successfully');
  };

  return (
    <div className="flex flex-col gap-6 mt-4 mx-auto">
      {/* --- Header --- */}

      {/* --- Filters --- */}
      <Card className="border-l-4 border-l-red-500 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-red-500" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Period Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Time Period
              </Label>
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

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Specific Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={period === 'all'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
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

            {/* Category Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Category Filter
                </Label>
                {selectedCategory && (
                  <span
                    className="text-xs text-red-500 cursor-pointer hover:underline"
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    Clear
                  </span>
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

            {/* Generate Button */}
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
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
                Export Actions
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spending
                </CardTitle>
                <Wallet className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₨ {reportData.summary.grandTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total outflow for selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transaction Count
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total number of receipts logged
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown (Visual) */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  Category Breakdown
                </CardTitle>
                <CardDescription>Spending distribution by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(reportData.summary.totalByCategory).map(
                  ([category, amount]: any) => {
                    const percentage =
                      (amount / reportData.summary.grandTotal) * 100;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-muted-foreground">
                            ₨ {amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2" />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
                {Object.keys(reportData.summary.totalByCategory).length ===
                  0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b bg-background/50 rounded-t-2xl ">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Expense History</CardTitle>
                    <CardDescription>
                      Detailed log of transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/50 z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.expenses.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No expenses found for this period
                          </TableCell>
                        </TableRow>
                      )}
                      {reportData.expenses.map((expense: any) => (
                        <TableRow key={expense.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground font-mono text-xs">
                            {format(new Date(expense.date), 'PP')}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              {expense.category.name}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {expense.description || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₨ {expense.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[400px] bg-background/50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Expense Report</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select a time period and optional category above, then click
            "Generate Report" to view spending analysis.
          </p>
        </div>
      )}
    </div>
  );
}
