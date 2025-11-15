'use client';

import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// table displays read-only item text (editing via dialog)
import { ProductType, ProductSubType, Room, PackType } from '@/types/config';

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
}) => {
  const items = watch('items') || [];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Subtype</TableHead>
            <TableHead>Pack</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Box</TableHead>
            <TableHead>Marka</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">KJ</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={11}
                className="text-center p-16 text-lg  text-muted-foreground"
              >
                No items added
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field, index) => {
              const item = items[index] || {};
              const typeName =
                productTypes.find((p) => p.id === item.productTypeId)?.name ||
                '-';
              const subTypeName =
                productSubTypes.find((s) => s.id === item.productSubTypeId)
                  ?.name || '-';
              const packName =
                packTypes.find((p) => p.id === item.packTypeId)?.name || '-';
              const roomName =
                rooms.find((r) => r.id === item.roomId)?.name || '-';
              const boxNo = item.boxNo || '-';
              const marka = item.marka || '-';
              const qty = item.quantity ?? 0;
              const unitPrice = item.unitPrice ?? 0;
              const kjText = item.hasKhaliJali
                ? `${item.kjQuantity ?? 0} x ${item.kjUnitPrice ?? 0}`
                : '-';

              return (
                <TableRow key={field.id}>
                  <TableCell>{typeName}</TableCell>
                  <TableCell>{subTypeName}</TableCell>
                  <TableCell>{packName}</TableCell>
                  <TableCell>{roomName}</TableCell>
                  <TableCell>{boxNo}</TableCell>
                  <TableCell>{marka}</TableCell>
                  <TableCell className="text-right">{qty}</TableCell>
                  <TableCell className="text-right">
                    {unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{kjText}</TableCell>
                  <TableCell className="text-right">
                    PKR {calculateItemTotal(index).toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          typeof onEdit === 'function' && onEdit(index, item)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ItemTable;
