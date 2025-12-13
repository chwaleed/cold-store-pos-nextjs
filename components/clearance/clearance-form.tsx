'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  clearanceReceiptSchema,
  type ClearanceReceiptFormData,
} from '@/schema/clearance';
import type {
  ClearedItemWithDetails,
  EntryItemWithDetails,
} from '@/types/clearance';

import { ClearanceFormFields } from './clearance-form-fields';
import { ClearedItemsTable } from './cleared-items-table';
import { AvailableItemsDialog } from './available-items-dialog';
import { QuantityDialog } from './quantity-dialog';
import { useClearanceItems } from './use-clearance-items';

export function ClearanceForm() {
  const router = useRouter();
  const [clearedItems, setClearedItems] = useState<ClearedItemWithDetails[]>(
    []
  );
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);
  const [filters, setFilters] = useState({
    room: 'all',
    type: 'all',
    subType: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  // Dialog States
  const [showAddItemsDialog, setShowAddItemsDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    EntryItemWithDetails | ClearedItemWithDetails | null
  >(null);
  const [clearQuantity, setClearQuantity] = useState<number>(0);
  const [clearKjQuantity, setClearKjQuantity] = useState<number>(0);

  // Custom hook for fetching items
  const {
    availableItems,
    loadingItems,
    pagination,
    currentPage,
    setCurrentPage,
  } = useClearanceItems({
    selectedCustomerId,
    showDialog: showAddItemsDialog,
    filters,
  });

  const form = useForm<ClearanceReceiptFormData>({
    resolver: zodResolver(clearanceReceiptSchema),
    mode: 'onBlur',
    defaultValues: {
      customerId: 0,
      carNo: '',
      receiptNo: '',
      description: '',
      clearanceDate: new Date(),
      paymentAmount: 0,
      discountAmount: 0,
      items: [],
    },
  });

  useEffect(() => {
    form.setValue('items', clearedItems, { shouldValidate: true });
  }, [clearedItems, form]);

  const handleCustomerChange = (customerId: number | undefined) => {
    if (clearedItems.length > 0 && selectedCustomerId !== customerId) {
      if (
        !confirm(
          'Changing customer will clear your current selections. Continue?'
        )
      ) {
        return;
      }
      setClearedItems([]);
    }

    setSelectedCustomerId(customerId);
    form.setValue('customerId', customerId || 0, { shouldValidate: true });
  };

  const handleOpenAddItemsDialog = () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer first');
      return;
    }
    setShowAddItemsDialog(true);
  };

  const handleSelectItemForQuantity = (item: EntryItemWithDetails) => {
    setSelectedItem(item);
    // Set product quantity (can be 0 if only KJ is remaining)
    setClearQuantity(item.remainingQuantity || 0);
    // Set KJ quantity if applicable
    setClearKjQuantity(item.hasKhaliJali ? item.remainingKjQuantity || 0 : 0);
    setShowQuantityDialog(true);
  };

  const handleAddItemWithQuantity = () => {
    if (!selectedItem) return;

    const availableQty =
      (selectedItem as any).remainingQuantity ??
      (selectedItem as any).availableQty ??
      0;

    const hasKj = (selectedItem as any).hasKhaliJali;
    const maxKj =
      (selectedItem as any).remainingKjQuantity ??
      (selectedItem as any).kjQuantity ??
      0;

    // Validate that at least one quantity is being cleared
    if (clearQuantity <= 0 && clearKjQuantity <= 0) {
      toast.error('You must clear at least product quantity or KJ quantity');
      return;
    }

    // Validate product quantity doesn't exceed available
    if (clearQuantity > availableQty) {
      toast.error(`Product quantity cannot exceed ${availableQty}`);
      return;
    }

    // Validate KJ quantity doesn't exceed available
    if (clearKjQuantity > maxKj) {
      toast.error(`KJ quantity cannot exceed ${maxKj}`);
      return;
    }

    // Ensure we don't have negative values
    if (clearQuantity < 0 || clearKjQuantity < 0) {
      toast.error('Quantities cannot be negative');
      return;
    }

    // If editing an existing cleared item
    if ((selectedItem as any).isEdit) {
      const updatedItem: any = {
        ...selectedItem,
        clearQuantity: clearQuantity,
        clearKjQuantity: hasKj ? clearKjQuantity : null,
        grandTotal:
          clearQuantity * selectedItem.unitPrice +
          (hasKj ? clearKjQuantity * (selectedItem.kjUnitPrice || 0) : 0),
      };

      setClearedItems((prev) =>
        prev.map((it) =>
          it.entryItemId === updatedItem.entryItemId ? updatedItem : it
        )
      );

      setShowQuantityDialog(false);
      setSelectedItem(null);
      toast.success('Item updated successfully');
      return;
    }

    const entryIdToCheck =
      (selectedItem as any).id ?? (selectedItem as any).entryItemId;
    if (clearedItems.some((item) => item.entryItemId === entryIdToCheck)) {
      toast.error('Item already added to clearance list');
      return;
    }

    const s = selectedItem as EntryItemWithDetails;
    const productName = s.productSubType
      ? `${s.productType.name} - ${s.productSubType.name}`
      : s.productType.name;

    const newItem: ClearedItemWithDetails = {
      type: s.productType.name,
      subType: s?.productSubType?.name ?? '',
      grandTotal:
        clearQuantity * s.unitPrice +
        (hasKj ? clearKjQuantity * (s.kjUnitPrice || 0) : 0),
      entryItemId: s.id,
      clearQuantity: clearQuantity,
      clearKjQuantity: s.hasKhaliJali ? clearKjQuantity : null,
      productName,
      boxNo: s.boxNo,
      packName: s.packType.name,
      roomName: s.room.name,
      availableQty: s.remainingQuantity,
      unitPrice: s.unitPrice,
      hasKhaliJali: s.hasKhaliJali,
      kjQuantity: s.kjQuantity,
      kjUnitPrice: s.kjUnitPrice,
    };

    setClearedItems([...clearedItems, newItem]);
    setShowQuantityDialog(false);
    setSelectedItem(null);
    toast.success('Item added successfully');
  };

  const handleRemoveItem = (entryItemId: number) => {
    setClearedItems(
      clearedItems.filter((item) => item.entryItemId !== entryItemId)
    );
    toast.success('Item removed');
  };

  const handleEditQuantity = (item: ClearedItemWithDetails) => {
    setSelectedItem({ ...item, isEdit: true } as any);
    setClearQuantity(item.clearQuantity ?? 0);
    setClearKjQuantity(item.clearKjQuantity ?? 0);
    setShowQuantityDialog(true);
  };

  const calculateTotalAmount = () => {
    return clearedItems.reduce((total, item) => total + item.grandTotal, 0);
  };

  const onSubmit = async (data: ClearanceReceiptFormData) => {
    const isValid = await form.trigger();

    if (!isValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (clearedItems.length === 0) {
      toast.error('Please select at least one item to clear');
      return;
    }

    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    setSubmitting(true);

    try {
      const clearanceData: ClearanceReceiptFormData = {
        ...data,
        customerId: selectedCustomerId,
        items: clearedItems.map((item) => ({
          entryItemId: item.entryItemId,
          clearQuantity: item.clearQuantity,
          clearKjQuantity: item.clearKjQuantity,
        })),
      };

      const response = await fetch('/api/clearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clearanceData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Clearance created successfully');
        router.push('/clearance');
      } else {
        toast.error(result.error || 'Failed to create clearance');
      }
    } catch (error) {
      toast.error('An error occurred while creating clearance');
    } finally {
      setSubmitting(false);
    }
  };

  // Get product display info for quantity dialog
  const getProductDisplay = () => {
    if (!selectedItem) return '';
    return (
      (selectedItem as any).productName ??
      ((selectedItem as any).productSubType
        ? `${(selectedItem as any).productType.name} - ${(selectedItem as any).productSubType.name}`
        : (selectedItem as any).productType?.name ?? '')
    );
  };

  const getAvailableQuantity = () => {
    return selectedItem
      ? (selectedItem as any).remainingQuantity ??
          (selectedItem as any).availableQty ??
          0
      : 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
        className="space-y-6"
      >
        <ClearanceFormFields
          form={form}
          onCustomerChange={handleCustomerChange}
        />

        <div className="flex w-full items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {clearedItems.length > 0 && (
              <span>
                Total Amount:{' '}
                <strong>PKR {calculateTotalAmount().toFixed(2)}</strong>
              </span>
            )}
          </div>
          <Button
            disabled={!selectedCustomerId}
            onClick={handleOpenAddItemsDialog}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <ClearedItemsTable
          items={clearedItems}
          onEdit={handleEditQuantity}
          onRemove={handleRemoveItem}
        />

        <AvailableItemsDialog
          open={showAddItemsDialog}
          onOpenChange={setShowAddItemsDialog}
          availableItems={availableItems}
          loading={loadingItems}
          filters={filters}
          setFilters={setFilters}
          onSelectItem={handleSelectItemForQuantity}
          clearedItemIds={clearedItems.map((item) => item.entryItemId)}
          pagination={pagination}
          onPageChange={setCurrentPage}
        />

        <QuantityDialog
          open={showQuantityDialog}
          onOpenChange={setShowQuantityDialog}
          productName={getProductDisplay()}
          availableQuantity={getAvailableQuantity()}
          unitPrice={selectedItem?.unitPrice ?? 0}
          hasKhaliJali={
            (selectedItem?.hasKhaliJali &&
              ((selectedItem as any)?.remainingKjQuantity ?? 0) > 0) ??
            false
          }
          kjQuantity={
            (selectedItem as any)?.remainingKjQuantity ??
            (selectedItem as any)?.kjQuantity ??
            0
          }
          kjUnitPrice={(selectedItem as any)?.kjUnitPrice ?? 0}
          clearQuantity={clearQuantity}
          clearKjQuantity={clearKjQuantity}
          onClearQuantityChange={setClearQuantity}
          onClearKjQuantityChange={setClearKjQuantity}
          onConfirm={handleAddItemWithQuantity}
          isEdit={(selectedItem as any)?.isEdit}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clearance')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              submitting || clearedItems.length === 0 || !selectedCustomerId
            }
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Clearance
          </Button>
        </div>
      </form>
    </Form>
  );
}
