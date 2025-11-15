'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface InventoryItem {
  id: number;
  entryDate: Date;
  customerName: string;
  marka: string | null;
  typeName: string;
  subtypeName: string | null;
  roomName: string;
  boxNo: string | null;
  availableQty: number;
  storageTillDate: Date | null;
  unitPrice: number;
  currentPrice: number;
  totalValue: number;
  daysInStorage: number;
  daysLeft: number | null;
  isDoubleRent: boolean;
}

interface InventoryTableProps {
  filters: {
    room: string;
    type: string;
    marka: string;
    dateFrom: string;
    dateTo: string;
    showZeroStock: boolean;
  };
}

export function InventoryTable({ filters }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchInventory();
  }, [filters]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.room !== 'all') params.append('room', filters.room);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.marka) params.append('marka', filters.marka);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('showZeroStock', filters.showZeroStock.toString());

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data || []);
        setSummary(
          data.summary || { totalItems: 0, totalQuantity: 0, totalValue: 0 }
        );
      } else {
        toast.error('Failed to load inventory');
      }
    } catch (error) {
      toast.error('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeftColor = (daysLeft: number | null) => {
    if (daysLeft === null) return 'text-muted-foreground';
    if (daysLeft <= 0) return 'text-red-600 font-bold';
    if (daysLeft <= 7) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{summary.totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold">
                {summary.totalQuantity.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                PKR {summary.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={fetchInventory} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subtype</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Box</TableHead>
              <TableHead className="text-right">Available Qty</TableHead>
              <TableHead>Storage Till</TableHead>
              <TableHead className="text-right">Days Left</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="text-center py-8 text-muted-foreground"
                >
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {format(new Date(item.entryDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.customerName}
                  </TableCell>
                  <TableCell>{item.marka || '-'}</TableCell>
                  <TableCell>
                    {item.isDoubleRent && <span className="mr-1">⚡</span>}
                    {item.typeName}
                  </TableCell>
                  <TableCell>{item.subtypeName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.roomName}</Badge>
                  </TableCell>
                  <TableCell>{item.boxNo || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.availableQty.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {item.storageTillDate
                      ? format(new Date(item.storageTillDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell
                    className={`text-right ${getDaysLeftColor(item.daysLeft)}`}
                  >
                    {item.daysLeft !== null ? `${item.daysLeft} days` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${item.isDoubleRent ? 'text-red-600 font-bold' : ''}`}
                  >
                    PKR {item.currentPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    PKR {item.totalValue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
