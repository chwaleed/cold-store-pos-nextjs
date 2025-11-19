'use client';

import { useState, useEffect } from 'react';
import { constructFrom, format } from 'date-fns';
import { RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DataTable from '@/components/dataTable/data-table';

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
  unitPrice: number;
  currentPrice: number;
  totalValue: number;
  daysInStorage: number;
  displayDays: number;
  isDoubleRent: boolean;
  hasKhaliJali: boolean;
  kjQuantity: number | null;
  kjUnitPrice: number | null;
  remainingKjQuantity: number | null;
  hasDoubleRentEnabled: boolean;
  grandTotal: number;
  isDoubled: boolean;
}

interface InventoryTableProps {
  filters: {
    room: string;
    type: string;
    subType: string;
    dateFrom: string;
    dateTo: string;
    search: string;
    customerId: string;
  };
}

export function InventoryTable({ filters }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalValue: 0,
  });

  const fetchInventory = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filters.room !== 'all') params.append('room', filters.room);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.subType !== 'all') params.append('subType', filters.subType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.customerId && filters.customerId !== '')
        params.append('customerId', filters.customerId);

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data || []);
        setCurrentPage(data.pagination?.currentPage || 1);
        setLastPage(data.pagination?.lastPage || 1);
        setSummary(data.summary || { totalQuantity: 0, totalValue: 0 });
      } else {
        toast.error('Failed to load inventory');
      }
    } catch (error) {
      toast.error('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (pageNo: number) => {
    setCurrentPage(pageNo);
    fetchInventory(pageNo);
  };

  const columns = [
    {
      name: 'Recipt No',
      accessor: 'reciptNo',
      id: 'index',
    },
    {
      name: 'Entry Date',
      accessor: (row: InventoryItem) =>
        format(new Date(row.entryDate), 'MMM dd, yyyy'),
      id: 'entryDate',
    },
    {
      name: 'Customer',
      accessor: 'customerName',
      id: 'customer',
      className: 'font-medium',
    },
    {
      name: 'Marka',
      accessor: (row: InventoryItem) => row.marka || '-',
      id: 'marka',
    },

    {
      name: 'Product',
      accessor: (row: InventoryItem) => (
        <div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">{row.typeName}</div>
            {row.hasDoubleRentEnabled && (
              <Zap size={14} className=" text-yellow-500 fill-yellow-500" />
            )}
          </div>
          {row.subtypeName && (
            <p className="text-xs text-muted-foreground leading-tight">
              {row.subtypeName}
            </p>
          )}
        </div>
      ),
      id: 'type',
    },

    {
      name: 'Room/Box',
      accessor: (row: InventoryItem) => (
        <div className=" items-center gap-1.5">
          <p className="text-sm">{row.roomName || 'N/A'}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Box: {row.boxNo}
          </p>
        </div>
      ),
      id: 'room',
    },

    {
      name: 'Available Qty',
      accessor: (row: InventoryItem) => (
        <div className="text-right">
          <span className="font-medium">{row.availableQty}</span>
          {row.hasKhaliJali && row.remainingKjQuantity !== null && (
            <p className="text-xs text-muted-foreground leading-tight">
              KJ: {row.remainingKjQuantity}
            </p>
          )}
        </div>
      ),
      id: 'qty',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Days in Storage',
      accessor: (row: InventoryItem) => (
        <div className="text-center">
          <p
            className={`text-sm font-semibold ${
              row.isDoubled ? 'text-red-600' : 'text-muted-foreground'
            }`}
          >
            {row.daysInStorage} days
          </p>
        </div>
      ),
      id: 'daysInStorage',
      className: 'text-center',
      headerClassName: 'text-center',
    },

    {
      name: 'Price',
      accessor: (row: any) => (
        <div className="text-xs leading-tight">
          <p>
            {row.availableQty} × {row?.unitPrice?.toFixed(2)}{' '}
          </p>
          <p className="text-muted-foreground">
            = {(row.availableQty * row?.unitPrice).toFixed(2)}
          </p>
        </div>
      ),

      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-center',
    },
    {
      name: 'KJ',
      accessor: (row: any) => {
        if (row.hasKhaliJali) {
          return (
            <div className="text-xs leading-tight">
              <p>
                {row.remainingKjQuantity} × {row?.kjUnitPrice?.toFixed(2)}{' '}
              </p>
              <p className="text-muted-foreground">
                ={' '}
                {(
                  row.remainingKjQuantity * row?.kjUnitPrice?.toFixed(2)
                ).toFixed(2)}
              </p>
            </div>
          );
        }
        return <span className="text-sm">-</span>;
      },

      id: 'currentPrice',
      className: 'text-right',
      headerClassName: 'text-center',
    },
    {
      name: 'Total Value',
      accessor: (row: InventoryItem) => {
        return `PKR ${row.grandTotal.toFixed(2)}`;
      },
      id: 'totalValue',
      className: 'text-right font-bold',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Current Stock</h1>
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Total Quantity: </p>
              <p className="text-xl font-bold">{summary.totalQuantity}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Total Value: </p>
              <p className="text-xl font-bold text-green-600">
                PKR {summary.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <hr className="h-[1px] bg-gray-100" />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No inventory items found"
        skeletonRows={10}
        currentPage={currentPage}
        lastPage={lastPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
