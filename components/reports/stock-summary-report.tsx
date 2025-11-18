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
import { Download, Printer, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateStockReportPDF } from '@/lib/pdf-generator.client';
import useStore from '@/app/(root)/(store)/store';

export function StockSummaryReport() {
  const { rooms } = useStore();
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>(
    undefined
  );
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (inventory.length === 0) {
      toast.error('Please fetch inventory first');
      return;
    }

    const roomName = selectedRoom
      ? rooms.find((r) => r.id.toString() === selectedRoom)?.name
      : 'All Rooms';

    const filters = {
      roomName,
    };

    const doc = generateStockReportPDF(inventory, summary, filters);
    doc.print();
  };

  const downloadPDF = () => {
    if (inventory.length === 0) {
      toast.error('Please fetch inventory first');
      return;
    }

    const roomName = selectedRoom
      ? rooms.find((r) => r.id.toString() === selectedRoom)?.name
      : 'All Rooms';

    const filters = {
      roomName,
    };

    const doc = generateStockReportPDF(inventory, summary, filters);
    doc.download(`stock-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRoom) {
        params.append('roomId', selectedRoom);
      }

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();

      if (res.ok) {
        setInventory(data.inventory || []);

        // Calculate summary
        const totalValue = data.inventory.reduce(
          (sum: number, item: any) =>
            sum + item.remainingQuantity * item.unitPrice,
          0
        );
        const totalQuantity = data.inventory.reduce(
          (sum: number, item: any) => sum + item.remainingQuantity,
          0
        );
        const totalItems = data.inventory.length;

        // Group by product type
        const byType: Record<
          string,
          { quantity: number; value: number; items: number }
        > = {};
        data.inventory.forEach((item: any) => {
          const typeName = item.productType.name;
          if (!byType[typeName]) {
            byType[typeName] = { quantity: 0, value: 0, items: 0 };
          }
          byType[typeName].quantity += item.remainingQuantity;
          byType[typeName].value += item.remainingQuantity * item.unitPrice;
          byType[typeName].items += 1;
        });

        // Group by room
        const byRoom: Record<
          string,
          { quantity: number; value: number; items: number }
        > = {};
        data.inventory.forEach((item: any) => {
          const roomName = item.room.name;
          if (!byRoom[roomName]) {
            byRoom[roomName] = { quantity: 0, value: 0, items: 0 };
          }
          byRoom[roomName].quantity += item.remainingQuantity;
          byRoom[roomName].value += item.remainingQuantity * item.unitPrice;
          byRoom[roomName].items += 1;
        });

        setSummary({
          totalValue,
          totalQuantity,
          totalItems,
          byType,
          byRoom,
        });

        toast.success('Inventory loaded successfully');
      } else {
        toast.error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!inventory.length) {
      toast.error('No inventory data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['STOCK SUMMARY REPORT'],
      ['Generated', format(new Date(), 'PPP pp')],
      [],
      ['OVERVIEW'],
      ['Total Value', summary.totalValue],
      ['Total Quantity', summary.totalQuantity],
      ['Total Items', summary.totalItems],
      [],
      ['BY PRODUCT TYPE'],
      ['Type', 'Quantity', 'Value', 'Items'],
    ];

    Object.entries(summary.byType).forEach(([type, data]: [string, any]) => {
      summaryData.push([type, data.quantity, data.value, data.items]);
    });

    summaryData.push([]);
    summaryData.push(['BY ROOM']);
    summaryData.push(['Room', 'Quantity', 'Value', 'Items']);

    Object.entries(summary.byRoom).forEach(([room, data]: [string, any]) => {
      summaryData.push([room, data.quantity, data.value, data.items]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Detailed Inventory Sheet
    const inventoryData = [
      [
        'Receipt No',
        'Customer',
        'Product Type',
        'Sub Type',
        'Room',
        'Box No',
        'Marka',
        'Quantity',
        'Unit Price',
        'Total Value',
        'Entry Date',
      ],
    ];

    inventory.forEach((item: any) => {
      inventoryData.push([
        item.entryReceipt.receiptNo,
        item.entryReceipt.customer.name,
        item.productType.name,
        item.productSubType?.name || 'N/A',
        item.room.name,
        item.boxNo || 'N/A',
        item.marka || 'N/A',
        item.remainingQuantity,
        item.unitPrice,
        item.remainingQuantity * item.unitPrice,
        format(new Date(item.entryReceipt.entryDate), 'PP'),
      ]);
    });

    const wsInventory = XLSX.utils.aoa_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Details');

    const fileName = `stock_summary_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Room (Optional)</Label>
                {selectedRoom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedRoom(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
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
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchInventory} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Inventory'}
            </Button>
            {inventory.length > 0 && (
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

      {summary && (
        <div ref={printRef} className="print:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock Summary</CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>Generated: {format(new Date(), 'PPP pp')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₨ {summary.totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Quantity
                  </p>
                  <p className="text-2xl font-bold">
                    {summary.totalQuantity.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{summary.totalItems}</p>
                </div>
              </div>

              {/* By Product Type */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Stock by Product Type
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Product Type</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Value</th>
                        <th className="p-2 text-right">Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byType).map(
                        ([type, data]: [string, any]) => (
                          <tr key={type} className="border-t">
                            <td className="p-2 font-medium">{type}</td>
                            <td className="p-2 text-right">
                              {data.quantity.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              ₨ {data.value.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">{data.items}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Room */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Stock by Room</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Room</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Value</th>
                        <th className="p-2 text-right">Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byRoom).map(
                        ([room, data]: [string, any]) => (
                          <tr key={room} className="border-t">
                            <td className="p-2 font-medium">{room}</td>
                            <td className="p-2 text-right">
                              {data.quantity.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              ₨ {data.value.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">{data.items}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Inventory */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Detailed Inventory ({inventory.length} items)
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Receipt</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-left">Room</th>
                        <th className="p-2 text-left">Box/Marka</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Value</th>
                        <th className="p-2 text-left">Entry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.entryReceipt.receiptNo}</td>
                          <td className="p-2">
                            {item.entryReceipt.customer.name}
                          </td>
                          <td className="p-2">
                            {item.productType.name}
                            {item.productSubType &&
                              ` - ${item.productSubType.name}`}
                          </td>
                          <td className="p-2">{item.room.name}</td>
                          <td className="p-2">
                            {item.boxNo || '-'} / {item.marka || '-'}
                          </td>
                          <td className="p-2 text-right">
                            {item.remainingQuantity.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            ₨ {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            ₨{' '}
                            {(item.remainingQuantity * item.unitPrice).toFixed(
                              2
                            )}
                          </td>
                          <td className="p-2">
                            {format(
                              new Date(item.entryReceipt.entryDate),
                              'PP'
                            )}
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
