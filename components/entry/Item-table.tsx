'use client';

import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/dataTable/data-table';
import { ProductType, ProductSubType, Room, PackType } from '@/types/config';

interface ItemClearanceStatus {
  entryItemId: number;
  isCleared: boolean;
  remainingQuantity: number;
  remainingKjQuantity: number | null;
}

interface ItemTableProps {
  control: any;
  register: any;
  watch: any;
  setValue: any;
  fields: any[];
  remove: (index: number) => void;
  onEdit?: (index: number, item: any) => void;
  productTypes: ProductType[];
  productSubTypes: ProductSubType[];
  rooms: Room[];
  packTypes: PackType[];
  calculateItemTotal: (index: number) => number;
  editMode?: boolean; // Add flag to indicate edit mode
  itemClearanceStatus?: Map<number, ItemClearanceStatus>; // Track cleared items
}

export const ItemTable: React.FC<ItemTableProps> = ({
  control,
  register,
  watch,
  setValue,
  fields,
  remove,
  onEdit,
  productTypes,
  productSubTypes,
  rooms,
  packTypes,
  calculateItemTotal,
  editMode = false,
  itemClearanceStatus,
}) => {
  const items = watch('items') || [];

  const columns = [
    {
      name: 'Type',
      accessor: (row: any, index: number) => {
        const typeName =
          productTypes.find((p) => p.id === row.productTypeId)?.name || '-';
        return typeName;
      },
      id: 'type',
    },
    {
      name: 'Subtype',
      accessor: (row: any) => {
        const subTypeName =
          productSubTypes.find((s) => s.id === row.productSubTypeId)?.name ||
          '-';
        return subTypeName;
      },
      id: 'subtype',
    },
    {
      name: 'Pack',
      accessor: (row: any) => {
        const packName =
          packTypes.find((p) => p.id === row.packTypeId)?.name || '-';
        return packName;
      },
      id: 'pack',
    },
    {
      name: 'Room',
      accessor: (row: any) => {
        const roomName = rooms.find((r) => r.id === row.roomId)?.name || '-';
        return roomName;
      },
      id: 'room',
    },
    {
      name: 'Box',
      accessor: (row: any) => row.boxNo || '-',
      id: 'box',
    },
    {
      name: 'Marka',
      accessor: (row: any) => row.marka || '-',
      id: 'marka',
    },
    {
      name: 'Qty',
      accessor: (row: any) => row.quantity ?? 0,
      id: 'qty',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Unit Price',
      accessor: (row: any) => (row.unitPrice ?? 0).toFixed(2),
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'KJ',
      accessor: (row: any) => {
        return row.hasKhaliJali
          ? `${row.kjQuantity ?? 0} x ${row.kjUnitPrice ?? 0}`
          : '-';
      },
      id: 'kj',
      className: 'text-right text-sm',
      headerClassName: 'text-right',
    },
    {
      name: 'Total',
      accessor: (row: any, index: number) => {
        return `PKR ${calculateItemTotal(index).toFixed(2)}`;
      },
      id: 'total',
      className: 'text-right font-medium',
      headerClassName: 'text-right',
    },
    {
      name: 'Actions',
      accessor: (row: any, index: number) => {
        const itemId = row.id;
        const isCleared = itemClearanceStatus?.get(itemId)?.isCleared || false;

        return (
          <div className="flex justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onEdit === 'function') {
                  onEdit(index, row);
                }
              }}
              disabled={editMode && isCleared}
              title={
                editMode && isCleared
                  ? 'Cannot edit cleared items'
                  : 'Edit item'
              }
            >
              <Pencil
                className={`h-4 w-4 ${editMode && isCleared ? 'opacity-50' : ''}`}
              />
            </Button>
            {!editMode && (
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(index);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
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
};

export default ItemTable;
