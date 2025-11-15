'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@radix-ui/react-checkbox';
import {
  clearanceReceiptSchema,
  type ClearanceReceiptFormData,
  type ClearedItemFormData,
} from '@/schema/clearance';
import type { Customer } from '@/types/customer';
import type { EntryItem } from '@/types/entry';

interface EntryReceiptWithItems {
  id: number;
  receiptNo: string;
  customerId: number;
  entryDate: Date;
  customer: Customer;
  items: Array<
    EntryItem & {
      productType: { name: string };
      productSubType: { name: string } | null;
      packType: { name: string };
      room: { name: string };
    }
  >;
}

interface ClearedItemWithDetails extends ClearedItemFormData {
  productName: string;
  packName: string;
  roomName: string;
  availableQty: number;
  unitPrice: number;
  hasKhaliJali: boolean;
  kjQuantity?: number | null;
  kjUnitPrice?: number | null;
}

export function ClearanceForm() {
  const router = useRouter();
  const [selectedEntryReceipt, setSelectedEntryReceipt] =
    useState<EntryReceiptWithItems | null>(null);
  const [clearedItems, setClearedItems] = useState<ClearedItemWithDetails[]>(
    []
  );
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptNoInput, setReceiptNoInput] = useState('');

  const form = useForm<Omit<ClearanceReceiptFormData, 'items'>>({
    resolver: zodResolver(clearanceReceiptSchema.omit({ items: true })),
    defaultValues: {
      customerId: 0,
      entryReceiptNo: '',
      carNo: '',
      description: '',
    },
  });

  const handleFetchEntryReceipt = async () => {
    if (!receiptNoInput.trim()) {
      toast.error('Please enter a receipt number');
      return;
    }

    setLoadingReceipt(true);
    try {
      const response = await fetch(
        `/api/entry/by-receipt-no/${encodeURIComponent(receiptNoInput)}`
      );
      const data = await response.json();

      if (data.success) {
        setSelectedEntryReceipt(data.data);
        form.setValue('entryReceiptNo', receiptNoInput);
        form.setValue('customerId', data.data.customerId);
        setClearedItems([]);
        toast.success('Entry receipt loaded successfully');
      } else {
        toast.error(data.error || 'Entry receipt not found');
        setSelectedEntryReceipt(null);
      }
    } catch (error) {
      toast.error('Failed to fetch entry receipt');
      setSelectedEntryReceipt(null);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const toggleItemForClearance = (entryItemId: number, checked: boolean) => {
    if (checked) {
      const entryItem = selectedEntryReceipt?.items.find(
        (item) => item.id === entryItemId
      );

      if (!entryItem) return;

      const productName = entryItem.productSubType
        ? `${entryItem.productType.name} - ${entryItem.productSubType.name}`
        : entryItem.productType.name;

      setClearedItems([
        ...clearedItems,
        {
          entryItemId,
          quantityCleared: entryItem.remainingQuantity,
          kjQuantityCleared: entryItem.hasKhaliJali
            ? entryItem.kjQuantity || 0
            : null,
          productName,
          packName: entryItem.packType.name,
          roomName: entryItem.room.name,
          availableQty: entryItem.remainingQuantity,
          unitPrice: entryItem.unitPrice,
          hasKhaliJali: entryItem.hasKhaliJali,
          kjQuantity: entryItem.kjQuantity,
          kjUnitPrice: entryItem.kjUnitPrice,
        },
      ]);
    } else {
      setClearedItems(
        clearedItems.filter((item) => item.entryItemId !== entryItemId)
      );
    }
  };

  const updateItemQuantity = (entryItemId: number, quantity: number) => {
    setClearedItems(
      clearedItems.map((item) =>
        item.entryItemId === entryItemId
          ? { ...item, quantityCleared: quantity }
          : item
      )
    );
  };

  const updateKjQuantity = (entryItemId: number, kjQuantity: number) => {
    setClearedItems(
      clearedItems.map((item) =>
        item.entryItemId === entryItemId
          ? { ...item, kjQuantityCleared: kjQuantity }
          : item
      )
    );
  };

  const calculateTotalRent = () => {
    if (!selectedEntryReceipt) return 0;

    const entryDate = new Date(selectedEntryReceipt.entryDate);
    const clearanceDate = new Date();
    const daysStored = Math.max(
      1,
      Math.ceil(
        (clearanceDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return clearedItems.reduce((total, item) => {
      // Rent = quantity × days × unitPrice (unitPrice is the rent per day)
      return total + item.quantityCleared * daysStored * item.unitPrice;
    }, 0);
  };

  const onSubmit = async (data: Omit<ClearanceReceiptFormData, 'items'>) => {
    if (clearedItems.length === 0) {
      toast.error('Please select at least one item to clear');
      return;
    }

    setSubmitting(true);

    try {
      const clearanceData: ClearanceReceiptFormData = {
        ...data,
        items: clearedItems.map((item) => ({
          entryItemId: item.entryItemId,
          quantityCleared: item.quantityCleared,
          kjQuantityCleared: item.kjQuantityCleared,
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

  const daysStored = selectedEntryReceipt
    ? Math.max(
        1,
        Math.ceil(
          (new Date().getTime() -
            new Date(selectedEntryReceipt.entryDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Clearance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Clearance Information</CardTitle>
            <CardDescription>
              Enter the physical entry receipt number to load items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Receipt Number Search */}
            <div className="flex gap-2">
              <div className="flex-1">
                <FormLabel>Entry Receipt Number *</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="e.g., CS-20231115-0001"
                    value={receiptNoInput}
                    onChange={(e) => setReceiptNoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchEntryReceipt();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleFetchEntryReceipt}
                    disabled={loadingReceipt}
                  >
                    {loadingReceipt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Show customer info if receipt loaded */}
            {selectedEntryReceipt && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {selectedEntryReceipt.customer.name}
                    {selectedEntryReceipt.customer.village &&
                      ` - ${selectedEntryReceipt.customer.village}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Date</p>
                  <p className="font-medium">
                    {new Date(
                      selectedEntryReceipt.entryDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Stored</p>
                  <p className="font-medium">{daysStored} days</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Items */}
        {selectedEntryReceipt && selectedEntryReceipt.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Items</CardTitle>
              <CardDescription>
                Select items to clear and specify quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Pack / Room</TableHead>
                    <TableHead>Box / Marka</TableHead>
                    <TableHead>Available Qty</TableHead>
                    <TableHead>Qty to Clear</TableHead>
                    <TableHead>KJ Qty</TableHead>
                    <TableHead>Rent/Day</TableHead>
                    <TableHead className="text-right">Total Rent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEntryReceipt.items.map((item) => {
                    const clearedItem = clearedItems.find(
                      (ci) => ci.entryItemId === item.id
                    );
                    const isSelected = !!clearedItem;
                    const productName = item.productSubType
                      ? `${item.productType.name} - ${item.productSubType.name}`
                      : item.productType.name;

                    const itemRent = clearedItem
                      ? clearedItem.quantityCleared *
                        daysStored *
                        item.unitPrice
                      : 0;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              toggleItemForClearance(
                                item.id,
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {productName}
                          {item.hasKhaliJali && (
                            <Badge variant="secondary" className="ml-2">
                              KJ
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.packType.name} / {item.room.name}
                        </TableCell>
                        <TableCell>
                          {item.boxNo || '-'} / {item.marka || '-'}
                        </TableCell>
                        <TableCell>{item.remainingQuantity}</TableCell>
                        <TableCell>
                          {isSelected ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={item.remainingQuantity}
                              value={clearedItem.quantityCleared}
                              onChange={(e) =>
                                updateItemQuantity(
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isSelected && item.hasKhaliJali ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={item.kjQuantity || 0}
                              value={clearedItem.kjQuantityCleared || 0}
                              onChange={(e) =>
                                updateKjQuantity(
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>PKR {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {isSelected ? `PKR ${itemRent.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* No items message */}
        {selectedEntryReceipt && selectedEntryReceipt.items.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No items available for clearance in this receipt. All items have
                been cleared.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Clearance Summary */}
        {clearedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Clearance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Items:
                  </span>
                  <Badge variant="secondary">{clearedItems.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Days Stored:
                  </span>
                  <Badge variant="secondary">{daysStored} days</Badge>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-semibold text-lg">Total Rent:</span>
                  <span className="font-bold text-2xl text-primary">
                    PKR {calculateTotalRent().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
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
            disabled={submitting || clearedItems.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Clearance
          </Button>
        </div>
      </form>
    </Form>
  );
}
