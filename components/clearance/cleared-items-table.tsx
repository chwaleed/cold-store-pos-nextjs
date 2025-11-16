'use client';

import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import DataTable from '../dataTable/data-table';
import type { ClearedItemWithDetails } from '@/types/clearance';

interface ClearedItemsTableProps {
  items: ClearedItemWithDetails[];
  onEdit: (item: ClearedItemWithDetails) => void;
  onRemove: (entryItemId: number) => void;
}

export function ClearedItemsTable({
  items,
  onEdit,
  onRemove,
}: ClearedItemsTableProps) {
  const columns = [
    {
      name: 'Product',
      accessor: (row: ClearedItemWithDetails) => (
        <div className="py-1">
          <p className="font-medium text-sm leading-tight">
            {row.type || 'N/A'}
          </p>
          {row.subType && (
            <p className="text-xs text-muted-foreground leading-tight">
              {row.subType}
            </p>
          )}
        </div>
      ),
      id: 'product',
    },
    {
      name: 'Pack',
      accessor: (row: ClearedItemWithDetails) => row.packName,
      id: 'pack',
    },
    {
      name: 'Room/Box No',
      accessor: (row: ClearedItemWithDetails) => (
        <div className="items-center gap-1.5">
          <p className="text-sm">{row.roomName || 'N/A'}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Box: {row.boxNo}
          </p>
        </div>
      ),
      id: 'room',
    },
    {
      name: 'Clear Qty',
      accessor: (row: ClearedItemWithDetails) => row.clearQuantity,
      id: 'qty',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Price',
      accessor: (row: ClearedItemWithDetails) => (
        <div className="text-xs leading-tight">
          <p>
            {row.clearQuantity} × {row.unitPrice?.toFixed(2)}
          </p>
          <p className="text-muted-foreground">
            = {(row.clearQuantity * row.unitPrice).toFixed(2)}
          </p>
        </div>
      ),
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'KJ Price',
      accessor: (row: ClearedItemWithDetails) => {
        return row.hasKhaliJali && row.clearKjQuantity ? (
          <div className="text-xs leading-tight">
            <p>
              {row.clearKjQuantity} × {row.kjUnitPrice?.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              = {(row.clearKjQuantity * (row.kjUnitPrice || 0)).toFixed(2)}
            </p>
          </div>
        ) : (
          '-'
        );
      },
      id: 'kj',
      className: 'text-right text-sm',
      headerClassName: 'text-right',
    },
    {
      name: 'Total',
      accessor: (row: ClearedItemWithDetails) => {
        return `PKR ${row.grandTotal.toFixed(2)}`;
      },
      id: 'total',
      className: 'text-right font-medium',
      headerClassName: 'text-right',
    },
    {
      name: 'Actions',
      accessor: (row: ClearedItemWithDetails) => (
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" onClick={() => onEdit(row)}>
            <Edit className="h-4 w-4 text-primarychart" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemove(row.entryItemId)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      id: 'actions',
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={false}
      emptyMessage="No items added"
      skeletonRows={3}
    />
  );
}
