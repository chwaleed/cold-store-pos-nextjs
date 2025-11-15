'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  clearanceReceiptSchema,
  type ClearanceReceiptFormData,
} from '@/schema/clearance';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import type {
  ClearedItemWithDetails,
  EntryItemWithDetails,
} from '@/types/clearance';
import DataTable from '../dataTable/data-table';

export function ClearanceForm() {
  const router = useRouter();
  const [availableItems, setAvailableItems] = useState<EntryItemWithDetails[]>(
    []
  );
  const [clearedItems, setClearedItems] = useState<ClearedItemWithDetails[]>(
    []
  );
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);

  // Add Items Dialog States
  const [showAddItemsDialog, setShowAddItemsDialog] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    marka: '',
    type: '',
    subtype: '',
    entryReceiptNo: '',
    room: '',
  });

  // Quantity Dialog States
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    EntryItemWithDetails | ClearedItemWithDetails | null
  >(null);
  const [clearQuantity, setClearQuantity] = useState<number>(0);
  const [clearKjQuantity, setClearKjQuantity] = useState<number>(0);

  const form = useForm<ClearanceReceiptFormData>({
    resolver: zodResolver(clearanceReceiptSchema),
    mode: 'onBlur', // Validate on blur to show errors when user leaves field
    defaultValues: {
      customerId: 0,
      carNo: '',
      receiptNo: '',
      description: '',
      clearanceDate: new Date(), // Add clearanceDate with default value
      items: [],
    },
  });

  // Fetch available items when customer is selected or filters change
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedCustomerId || !showAddItemsDialog) {
        return;
      }

      setLoadingItems(true);
      try {
        const params = new URLSearchParams({
          customerId: selectedCustomerId.toString(),
          limit: '100',
        });

        if (searchFilters.entryReceiptNo) {
          params.append('entryReceiptNo', searchFilters.entryReceiptNo);
        }

        const response = await fetch(`/api/entry/items?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          // Apply client-side filtering
          let filteredItems = data.data;

          if (searchFilters.marka) {
            filteredItems = filteredItems.filter((item: EntryItemWithDetails) =>
              item.marka
                ?.toLowerCase()
                .includes(searchFilters.marka.toLowerCase())
            );
          }

          if (searchFilters.type) {
            filteredItems = filteredItems.filter((item: EntryItemWithDetails) =>
              item.productType.name
                .toLowerCase()
                .includes(searchFilters.type.toLowerCase())
            );
          }

          if (searchFilters.subtype) {
            filteredItems = filteredItems.filter((item: EntryItemWithDetails) =>
              item.productSubType?.name
                .toLowerCase()
                .includes(searchFilters.subtype.toLowerCase())
            );
          }

          if (searchFilters.room) {
            filteredItems = filteredItems.filter((item: EntryItemWithDetails) =>
              item.room.name
                .toLowerCase()
                .includes(searchFilters.room.toLowerCase())
            );
          }

          setAvailableItems(filteredItems);
        } else {
          toast.error('Failed to fetch available items');
        }
      } catch (error) {
        toast.error('Failed to fetch available items');
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [selectedCustomerId, showAddItemsDialog, searchFilters]);

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
    setClearQuantity(item.remainingQuantity);
    setClearKjQuantity(item.hasKhaliJali ? item.kjQuantity || 0 : 0);
    setShowQuantityDialog(true);
  };

  const handleAddItemWithQuantity = () => {
    if (!selectedItem) return;

    const availableQty =
      (selectedItem as any).remainingQuantity ??
      (selectedItem as any).availableQty ??
      0;

    if (clearQuantity <= 0 || clearQuantity > availableQty) {
      toast.error(`Quantity must be between 1 and ${availableQty}`);
      return;
    }

    const hasKj = (selectedItem as any).hasKhaliJali;
    const maxKj = (selectedItem as any).kjQuantity ?? 0;
    if (hasKj && (clearKjQuantity < 0 || clearKjQuantity > maxKj)) {
      toast.error(`KJ quantity must be between 0 and ${maxKj}`);
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

    const newItem: any = {
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

  const calculateTotalAmount = () => {
    return clearedItems.reduce((total, item) => {
      const itemAmount = item.clearQuantity * item.unitPrice;
      const kjAmount =
        item.clearKjQuantity && item.kjUnitPrice
          ? item.clearKjQuantity * item.kjUnitPrice
          : 0;
      return total + itemAmount + kjAmount;
    }, 0);
  };

  const onSubmit = async (data: ClearanceReceiptFormData) => {
    console.log('onSubmit called with data:', data);
    console.log('clearedItems:', clearedItems);
    console.log('selectedCustomerId:', selectedCustomerId);

    // Manually trigger validation to show all errors
    const isValid = await form.trigger();

    if (!isValid) {
      console.log('Form validation failed:', form.formState.errors);
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

  const handleEditQuantity = (item: ClearedItemWithDetails) => {
    setSelectedItem({ ...item, isEdit: true } as any);
    setClearQuantity(item.clearQuantity ?? 0);
    setClearKjQuantity(item.clearKjQuantity ?? 0);
    setShowQuantityDialog(true);
  };

  const productDisplay = selectedItem
    ? (selectedItem as any).productName ??
      ((selectedItem as any).productSubType
        ? `${(selectedItem as any).productType.name} - ${(selectedItem as any).productSubType.name}`
        : (selectedItem as any).productType?.name ?? '')
    : '';

  const availableQuantity = selectedItem
    ? (selectedItem as any).remainingQuantity ??
      (selectedItem as any).availableQty ??
      0
    : 0;

  const dialogUnitPrice = selectedItem
    ? (selectedItem as any).unitPrice ?? 0
    : 0;
  const dialogHasKj = selectedItem
    ? (selectedItem as any).hasKhaliJali ?? false
    : false;
  const dialogKjQuantity = selectedItem
    ? (selectedItem as any).kjQuantity ?? 0
    : 0;
  const dialogKjUnitPrice = selectedItem
    ? (selectedItem as any).kjUnitPrice ?? 0
    : 0;

  const clamp = (v: number, min: number, max: number) => {
    if (Number.isNaN(v)) return min;
    return Math.min(Math.max(v, min), max);
  };

  const availableItemsColumns = [
    {
      name: 'Receipt No',
      accessor: (row: EntryItemWithDetails) => row.entryReceipt.receiptNo,
      id: 'receiptNo',
    },
    {
      name: 'Product',
      accessor: (row: EntryItemWithDetails) => {
        return row.productSubType
          ? `${row.productType.name} - ${row.productSubType.name}`
          : row.productType.name;
      },
      id: 'product',
    },
    {
      name: 'Pack',
      accessor: (row: EntryItemWithDetails) => row.packType.name,
      id: 'pack',
    },
    {
      name: 'Room',
      accessor: (row: EntryItemWithDetails) => row.room.name,
      id: 'room',
    },
    {
      name: 'Marka',
      accessor: (row: EntryItemWithDetails) => row.marka || '-',
      id: 'marka',
    },
    {
      name: 'Available Qty',
      accessor: (row: EntryItemWithDetails) => row.remainingQuantity.toFixed(2),
      id: 'qty',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'Price',
      accessor: (row: EntryItemWithDetails) =>
        `PKR ${row.unitPrice.toFixed(2)}`,
      id: 'unitPrice',
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      name: 'KJ',
      accessor: (row: EntryItemWithDetails) => {
        return row.hasKhaliJali
          ? `${row.kjQuantity ?? 0} x ${row.kjUnitPrice ?? 0}`
          : '-';
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
          onClick={() => handleSelectItemForQuantity(row)}
          disabled={clearedItems.some((item) => item.entryItemId === row.id)}
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

  const clearedItemsColumns = [
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
              = {(row.clearKjQuantity * row.kjUnitPrice).toFixed(2)}
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleEditQuantity(row)}
          >
            <Edit className="h-4 w-4 text-primarychart" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleRemoveItem(row.entryItemId)}
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
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('Form submit event triggered');
          console.log('Form errors:', form.formState.errors);
          console.log('Form values:', form.getValues());
          form.handleSubmit(
            (data) => {
              console.log('Validation passed! Data:', data);
              onSubmit(data);
            },
            (errors) => {
              console.log('Validation failed! Errors:', errors);
            }
          )(e);
        }}
        className="space-y-6"
      >
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <FormControl>
                    <CustomerSearchSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCustomerChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clearanceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clearance Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={format(field.value, 'yyyy-MM-dd')}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carNo"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Car Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ABC-123"
                      {...field}
                      className={
                        fieldState.error
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptNo"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Receipt No *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., CS-20240101-0001"
                      {...field}
                      className={
                        fieldState.error
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-4">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional notes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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

        <DataTable
          columns={clearedItemsColumns}
          data={clearedItems}
          loading={false}
          emptyMessage="No items added"
          skeletonRows={3}
        />

        <Dialog open={showAddItemsDialog} onOpenChange={setShowAddItemsDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Items to Clearance</DialogTitle>
              <DialogDescription>
                Search and select items from customer's inventory
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4">
              <div>
                <Label htmlFor="search-marka">Marka</Label>
                <Input
                  id="search-marka"
                  placeholder="Search by marka"
                  value={searchFilters.marka}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      marka: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="search-type">Type</Label>
                <Input
                  id="search-type"
                  placeholder="Search by type"
                  value={searchFilters.type}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, type: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="search-subtype">Subtype</Label>
                <Input
                  id="search-subtype"
                  placeholder="Search by subtype"
                  value={searchFilters.subtype}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      subtype: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="search-receipt">Entry Receipt No</Label>
                <Input
                  id="search-receipt"
                  placeholder="Search by receipt"
                  value={searchFilters.entryReceiptNo}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      entryReceiptNo: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="search-room">Room</Label>
                <Input
                  id="search-room"
                  placeholder="Search by room"
                  value={searchFilters.room}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, room: e.target.value })
                  }
                />
              </div>
            </div>

            <DataTable
              columns={availableItemsColumns}
              data={availableItems}
              loading={loadingItems}
              emptyMessage="No items available for this customer"
              skeletonRows={5}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddItemsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Clearance Quantity</DialogTitle>
              <DialogDescription>
                Specify how much quantity to clear for this item
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="text-sm">{productDisplay}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Available Quantity
                  </Label>
                  <p className="text-sm font-semibold">
                    {availableQuantity.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clear-qty">Clear Quantity *</Label>
                  <Input
                    id="clear-qty"
                    type="number"
                    min="0"
                    max={availableQuantity}
                    step="0.01"
                    value={clearQuantity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setClearQuantity(
                        clamp(Number.isNaN(v) ? 0 : v, 0, availableQuantity)
                      );
                    }}
                    onBlur={() =>
                      setClearQuantity((prev) =>
                        clamp(prev, 0, availableQuantity)
                      )
                    }
                  />
                </div>

                {dialogHasKj && (
                  <div className="space-y-2">
                    <Label htmlFor="clear-kj-qty">
                      Khali Jali Quantity (Max: {dialogKjQuantity || 0})
                    </Label>
                    <Input
                      id="clear-kj-qty"
                      type="number"
                      min="0"
                      max={dialogKjQuantity || 0}
                      step="1"
                      value={clearKjQuantity}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setClearKjQuantity(
                          clamp(Number.isNaN(v) ? 0 : v, 0, dialogKjQuantity)
                        );
                      }}
                      onBlur={() =>
                        setClearKjQuantity((prev) =>
                          clamp(prev, 0, dialogKjQuantity)
                        )
                      }
                    />
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Item Total:</span>
                    <span className="font-medium">
                      PKR {(clearQuantity * dialogUnitPrice).toFixed(2)}
                    </span>
                  </div>
                  {dialogHasKj && dialogKjUnitPrice && (
                    <div className="flex justify-between text-sm">
                      <span>KJ Total:</span>
                      <span className="font-medium">
                        PKR {(clearKjQuantity * dialogKjUnitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold border-t pt-2">
                    <span>Grand Total:</span>
                    <span>
                      PKR
                      {(
                        clearQuantity * dialogUnitPrice +
                        (dialogHasKj && dialogKjUnitPrice
                          ? clearKjQuantity * dialogKjUnitPrice
                          : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuantityDialog(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddItemWithQuantity}>
                Add to Clearance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
            onClick={async (e) => {
              // Trigger validation manually before submit
              const isValid = await form.trigger();
              if (!isValid) {
                e.preventDefault();
                console.log('Validation errors:', form.formState.errors);
                toast.error('Please fill in all required fields');
              }
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Clearance
          </Button>
        </div>
      </form>
    </Form>
  );
}
