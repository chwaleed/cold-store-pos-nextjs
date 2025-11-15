'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
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
    subType: string;
    dateFrom: string;
    dateTo: string;
  };
}

export function InventoryTable({ filters }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchInventory(1);
  }, [filters]);

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

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data || []);
        setCurrentPage(data.pagination?.currentPage || 1);
        setLastPage(data.pagination?.lastPage || 1);
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

  const handlePageChange = (pageNo: number) => {
    setCurrentPage(pageNo);
    fetchInventory(pageNo);
  };

  const getDaysLeftColor = (daysLeft: number | null) => {
    if (daysLeft === null) return 'text-muted-foreground';
    if (daysLeft <= 0) return 'text-red-600 font-bold';
    if (daysLeft <= 7) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const columns = [
    {
      name: '#',
      accessor: (_row: InventoryItem, index: number) => index + 1,
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
    //  <div className="py-1">
    //       <p className="font-medium text-sm leading-tight">
    //         {row.productType?.name || 'N/A'}
    //       </p>
    //       {row.productSubType && (
    //         <p className="text-xs text-muted-foreground leading-tight">
    //           {row.productSubType.name}
    //         </p>
    //       )}
    //     </div>
    {
      name: 'Product',
      accessor: (row: InventoryItem) => (
        <div>
          <div>
            {row.isDoubleRent && <span className="mr-1">⚡</span>}
            {row.typeName}
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
      accessor: (row: InventoryItem) => row.availableQty.toFixed(2),
      id: 'qty',
      className: 'text-right font-medium',
      headerClassName: 'text-right',
    },
    {
      name: 'Storage Till',
      accessor: (row: InventoryItem) =>
        row.storageTillDate
          ? format(new Date(row.storageTillDate), 'MMM dd, yyyy')
          : '-',
      id: 'storageTill',
    },
    {
      name: 'Days Left',
      accessor: (row: InventoryItem) => (
        <span className={getDaysLeftColor(row.daysLeft)}>
          {row.daysLeft !== null ? `${row.daysLeft} days` : '-'}
        </span>
      ),
      id: 'daysLeft',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Price',
      accessor: (row: InventoryItem) => {
        console.log(row);
        return (
          <div className="text-xs leading-tight">
            <p>
              {row.availableQty} × {row.unitPrice?.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              {/* = {row.totalPrice?.toFixed(2)} */}
            </p>
          </div>
        );
      },
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Current Price',
      accessor: (row: InventoryItem) => (
        <span className={row.isDoubleRent ? 'text-red-600 font-bold' : ''}>
          PKR {row.currentPrice.toFixed(2)}
        </span>
      ),
      id: 'currentPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Total Value',
      accessor: (row: InventoryItem) => `PKR ${row.totalValue.toFixed(2)}`,
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
              <p className="text-sm text-muted-foreground">Total Items: </p>
              <p className="text-xl font-bold">{summary.totalItems}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Total Quantity: </p>
              <p className="text-xl font-bold">
                {summary.totalQuantity.toFixed(2)}
              </p>
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
