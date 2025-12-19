'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import {
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Search,
  FileText,
  ChevronDown,
  DoorOpen,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import useStore from '@/app/(root)/(store)/store';

type ReportMode = 'customer' | 'product' | 'both';

export function RoomWiseReport() {
  const { rooms } = useStore();
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>(
    undefined
  );
  const [reportMode, setReportMode] = useState<ReportMode>('customer');
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!selectedRoom) {
      toast.error('Please select a room');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        roomId: selectedRoom,
        mode: reportMode,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      });

      const res = await fetch(`/api/reports/room-wise?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data);
        toast.success('Room-wise report generated successfully');
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

  const downloadPDF = async () => {
    if (!reportData || !selectedRoom) return;

    try {
      const roomName =
        rooms.find((r) => r.id.toString() === selectedRoom)?.name || 'Unknown';

      const res = await fetch('/api/reports/room-wise/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData,
          roomName,
          reportMode,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room_wise_report_${roomName}_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();
    const roomName =
      rooms.find((r) => r.id.toString() === selectedRoom)?.name || 'Unknown';

    if (reportMode === 'customer' || reportMode === 'both') {
      const customerData = [
        ['ROOM-WISE REPORT (CUSTOMER-WISE)'],
        ['Room', roomName],
        ['From Date', format(fromDate, 'PPP')],
        ['To Date', format(toDate, 'PPP')],
        ['Generated On', new Date().toLocaleString()],
        [],
        ['Customer Name', 'Stock Entered', 'Stock Cleared', 'Remaining Stock'],
      ];

      reportData.customerWise?.forEach((item: any) => {
        customerData.push([
          item.customerName,
          item.stockEntered,
          item.stockCleared,
          item.remainingStock,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(customerData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Customer-Wise');
    }

    if (reportMode === 'product' || reportMode === 'both') {
      const productData = [
        ['ROOM-WISE REPORT (PRODUCT-WISE)'],
        ['Room', roomName],
        ['From Date', format(fromDate, 'PPP')],
        ['To Date', format(toDate, 'PPP')],
        ['Generated On', new Date().toLocaleString()],
        [],
        [
          'Product Type',
          'Sub Type',
          'Entered Quantity',
          'Cleared Quantity',
          'Remaining',
        ],
      ];

      reportData.productWise?.forEach((item: any) => {
        productData.push([
          item.productType,
          item.productSubType || '-',
          item.enteredQuantity,
          item.clearedQuantity,
          item.remainingQuantity,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(productData);
      ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Product-Wise');
    }

    XLSX.writeFile(
      wb,
      `room_wise_report_${roomName}_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.xlsx`
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

            {/* Room Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Select Room
              </Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Mode */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Report Type
              </Label>
              <Select
                value={reportMode}
                onValueChange={(v) => setReportMode(v as ReportMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer-Wise</SelectItem>
                  <SelectItem value="product">Product-Wise</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading || !selectedRoom}
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
        <div className="space-y-6 mt-3 animate-in fade-in-50 duration-500">
          {/* Report Header */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <DoorOpen className="h-6 w-6" />
                Room-Wise Report:{' '}
                {rooms.find((r) => r.id.toString() === selectedRoom)?.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Report Mode:{' '}
                {reportMode === 'customer'
                  ? 'Customer-Wise'
                  : reportMode === 'product'
                    ? 'Product-Wise'
                    : 'Both'}
                <br />
                Period: {format(fromDate, 'MMM dd, yyyy')} -{' '}
                {format(toDate, 'MMM dd, yyyy')}
              </div>
            </CardHeader>
          </Card>

          {/* Customer-Wise Table */}
          {(reportMode === 'customer' || reportMode === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer-Wise Summary</CardTitle>
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
                          Stock Entered
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Stock Cleared
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Remaining Stock
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.customerWise?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No customer data found for this room
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.customerWise?.map(
                          (item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {item.customerName}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.stockEntered}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.stockCleared}
                              </TableCell>
                              <TableCell className="text-right font-medium text-orange-600">
                                {item.remainingStock}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product-Wise Table */}
          {(reportMode === 'product' || reportMode === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product-Wise Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">
                          Product Type
                        </TableHead>
                        <TableHead className="font-semibold">
                          Sub Type
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Entered Quantity
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Cleared Quantity
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Remaining
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.productWise?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No product data found for this room
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.productWise?.map(
                          (item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {item.productType}
                              </TableCell>
                              <TableCell>
                                {item.productSubType || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.enteredQuantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.clearedQuantity}
                              </TableCell>
                              <TableCell className="text-right font-medium text-orange-600">
                                {item.remainingQuantity}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Empty State
        <div className="flex mt-3 flex-col items-center justify-center h-[400px] bg-background rounded-xl border border-dashed">
          <div className="bg-foreground/10 p-4 rounded-full mb-4 shadow-sm">
            <DoorOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Report Generated</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Select a room and report type above, then click "Generate Report" to
            view room-wise summary.
          </p>
        </div>
      )}
    </div>
  );
}
