'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  entryReceiptSchema,
  EntryReceiptFormData,
  EntryItemFormData,
} from '@/schema/entry';
import { useToast } from '@/components/ui/use-toast';
import { ProductType, ProductSubType, Room, PackType } from '@/types/config';
import { useRouter } from 'next/navigation';
import { EntryItemDialog } from './entry-item-dialog';
import ItemTable from './Item-table';
import useStore from '@/app/(root)/(store)/store';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import { Skeleton } from '@/components/ui/skeleton';

interface EntryEditFormProps {
  entryId: number;
}

export function EntryEditForm({ entryId }: EntryEditFormProps) {
  const productTypes = useStore((state) => state.types);
  const productSubTypes = useStore((state) => state.subType);
  const rooms = useStore((state) => state.rooms);
  const packTypes = useStore((state) => state.packTypes);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EntryReceiptFormData>({
    resolver: zodResolver(entryReceiptSchema),
    defaultValues: {
      customerId: 0,
      carNo: '',
      receiptNo: '',
      description: '',
      items: [],
    },
  });

  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EntryItemFormData | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Fetch existing entry data
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setFetchingData(true);
        const response = await fetch(`/api/entry/${entryId}`);
        const result = await response.json();

        if (result.success) {
          const entry = result.data;

          // Map entry items to form format
          const formattedItems = entry.items.map((item: any) => ({
            productTypeId: item.productTypeId,
            productSubTypeId: item.productSubTypeId || undefined,
            packTypeId: item.packTypeId,
            roomId: item.roomId,
            boxNo: item.boxNo || '',
            marka: item.marka || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            hasKhaliJali: item.hasKhaliJali,
            kjQuantity: item.kjQuantity || undefined,
            kjUnitPrice: item.kjUnitPrice || undefined,
          }));

          form.reset({
            customerId: entry.customerId,
            carNo: entry.carNo,
            receiptNo: entry.receiptNo,
            description: entry.description || '',
            items: formattedItems,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entry data',
            variant: 'destructive',
          });
          router.push('/records');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch entry data',
          variant: 'destructive',
        });
        router.push('/records');
      } finally {
        setFetchingData(false);
      }
    };

    fetchEntry();
  }, [entryId, form, router, toast]);

  const onSubmit = async (data: EntryReceiptFormData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/entry/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Entry receipt updated successfully',
        });
        router.push('/records');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update entry receipt',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update entry receipt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (index: number) => {
    const item = form.watch(`items.${index}`);
    const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    const kjTotal = item.hasKhaliJali
      ? (item.kjQuantity || 0) * (item.kjUnitPrice || 0)
      : 0;
    return totalPrice + kjTotal;
  };

  const calculateGrandTotal = () => {
    const items = form.watch('items');
    return items.reduce((sum, item) => {
      const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
      const kjTotal = item.hasKhaliJali
        ? (item.kjQuantity || 0) * (item.kjUnitPrice || 0)
        : 0;
      return sum + totalPrice + kjTotal;
    }, 0);
  };

  if (fetchingData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 flex flex-col"
      >
        {/* Header Information */}
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
                      onValueChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt No *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., CS-20240101-0001"
                      {...field}
                      disabled
                    />
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

        {/* Items table - Note: Cannot delete items in edit mode */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Note: You can edit item details but cannot delete items in edit
            mode.
          </div>
          <ItemTable
            control={form.control}
            register={form.register}
            watch={form.watch}
            setValue={form.setValue}
            fields={fields}
            remove={() => {}} // Disabled - no delete in edit mode
            onEdit={(index, item) => {
              setEditItem(item);
              setEditIndex(index);
              setItemDialogOpen(true);
            }}
            productTypes={productTypes}
            productSubTypes={productSubTypes}
            rooms={rooms}
            packTypes={packTypes}
            calculateItemTotal={calculateItemTotal}
            editMode={true}
          />
        </div>

        <EntryItemDialog
          open={itemDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setItemDialogOpen(false);
              setEditItem(null);
              setEditIndex(null);
            } else {
              setItemDialogOpen(true);
            }
          }}
          onAdd={(data) => {
            if (editIndex !== null && editIndex !== undefined) {
              update(editIndex, data);
            } else {
              append(data);
            }
            setEditItem(null);
            setEditIndex(null);
            setItemDialogOpen(false);
          }}
          editItem={
            editItem
              ? { ...editItem, index: editIndex ?? undefined }
              : undefined
          }
          productTypes={productTypes}
          productSubTypes={productSubTypes}
          rooms={rooms}
          packTypes={packTypes}
        />

        {/* Grand Total & Actions */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            Grand Total: PKR {calculateGrandTotal().toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/records')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Updating...' : 'Update Entry'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
