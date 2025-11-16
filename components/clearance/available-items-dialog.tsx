'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import DataTable from '../dataTable/data-table';
import type { EntryItemWithDetails } from '@/types/clearance';
import { InventoryFilters } from '../inventory/inventory-filters';

interface AvailableItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableItems: EntryItemWithDetails[];
  loading: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  onSelectItem: (item: EntryItemWithDetails) => void;
  clearedItemIds: number[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
}

export function AvailableItemsDialog({
  open,
  onOpenChange,
  availableItems,
  loading,
  filters,
  setFilters,
  onSelectItem,
  clearedItemIds,
  pagination,
  onPageChange,
}: AvailableItemsDialogProps) {
  const columns = [
    {
      name: 'Receipt No',
      accessor: (row: EntryItemWithDetails) => row.entryReceipt.receiptNo,
      id: 'receiptNo',
    },
    {
      name: 'Product',
      accessor: (row: EntryItemWithDetails) => (
        <div className="py-1">
          <p className="font-medium text-sm leading-tight">
            {row.productType?.name || 'N/A'}
          </p>
          {row.productSubType && (
            <p className="text-xs text-muted-foreground leading-tight">
              {row.productSubType.name}
            </p>
          )}
        </div>
      ),
      id: 'product',
    },
    {
      name: 'Pack',
      accessor: (row: EntryItemWithDetails) => row.packType.name,
      id: 'pack',
    },
    {
      name: 'Room',
      accessor: (row: EntryItemWithDetails) => (
        <div className="items-center gap-1.5">
          <p className="text-sm">{row.room?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Box: {row?.boxNo}
          </p>
        </div>
      ),
      id: 'room',
    },
    {
      name: 'Marka',
      accessor: (row: EntryItemWithDetails) => row.marka || '-',
      id: 'marka',
    },
    {
      name: 'Available Qty',
      accessor: (row: EntryItemWithDetails) => row.remainingQuantity,
      id: 'qty',
      className: 'text-center',
      headerClassName: 'text-right',
    },
    {
      name: 'Price',
      accessor: (row: any) => (
        <div className="text-xs leading-tight">
          <p>
            {row.remainingQuantity} × {row.unitPrice?.toFixed(2)}
          </p>
          <p className="text-muted-foreground">
            = {(row.remainingQuantity * row.unitPrice)?.toFixed(2)}
          </p>
        </div>
      ),
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'KJ',
      accessor: (row: any) => {
        console.log('row ', row);
        if (row.hasKhaliJali && row.kjQuantity) {
          return (
            <div className="text-xs leading-tight">
              <p>
                {row.kjQuantity} × {row.kjUnitPrice?.toFixed(2)}
              </p>
              <p className="text-muted-foreground">
                = {row.kjTotal?.toFixed(2)}
              </p>
            </div>
          );
        }
        return <span className="text-sm">-</span>;
      },
      id: 'kj',
      className: 'text-right text-sm',
      headerClassName: 'text-right',
    },
    {
      name: 'Actions',
      accessor: (row: EntryItemWithDetails) => (
        <Button
          size="sm"
          onClick={() => onSelectItem(row)}
          disabled={clearedItemIds.includes(row.id)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      ),
      id: 'actions',
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  console.log('Available Items:', availableItems);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Items to Clearance</DialogTitle>
          <DialogDescription>
            Search and select items from customer&apos;s inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters with integrated search */}
          <InventoryFilters
            filters={filters}
            setFilters={setFilters}
            searchPlaceholder="Search by receipt no, marka, or box no..."
          />
        </div>

        <DataTable
          columns={columns}
          data={availableItems}
          loading={loading}
          emptyMessage="No items available for this customer"
          skeletonRows={5}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {availableItems.length} of {pagination.totalItems} items
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
