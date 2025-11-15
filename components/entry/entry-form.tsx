'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Edit, Receipt } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@radix-ui/react-checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  entryReceiptSchema,
  EntryReceiptFormData,
  EntryItemFormData,
} from '@/schema/entry';
import { useToast } from '@/components/ui/use-toast';
import { Customer } from '@/types/customer';
import { ProductType, ProductSubType, Room, PackType } from '@/types/config';
import { useRouter } from 'next/navigation';
import { EntryItemDialog } from './entry-item-dialog';
import ItemTable from './Item-table';

interface EntryFormProps {
  onSuccess?: () => void;
}

export function EntryForm({ onSuccess }: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productSubTypes, setProductSubTypes] = useState<ProductSubType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [packTypes, setPackTypes] = useState<PackType[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EntryReceiptFormData>({
    resolver: zodResolver(entryReceiptSchema),
    defaultValues: {
      customerId: 0,
      carNo: '',
      description: '',
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EntryItemFormData | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, typesRes, subTypesRes, roomsRes, packTypesRes] =
          await Promise.all([
            fetch('/api/customer?limit=1000'),
            fetch('/api/producttype'),
            fetch('/api/productsubtype'),
            fetch('/api/room'),
            fetch('/api/packtype'),
          ]);

        const [
          customersData,
          typesData,
          subTypesData,
          roomsData,
          packTypesData,
        ] = await Promise.all([
          customersRes.json(),
          typesRes.json(),
          subTypesRes.json(),
          roomsRes.json(),
          packTypesRes.json(),
        ]);

        if (customersData.success) setCustomers(customersData.data);
        if (typesData.success) setProductTypes(typesData.data);
        if (subTypesData.success) setProductSubTypes(subTypesData.data);
        if (roomsData.success) setRooms(roomsData.data);
        if (packTypesData.success) setPackTypes(packTypesData.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (data: EntryReceiptFormData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Entry receipt ${result.data.receiptNo} created successfully`,
        });
        form.reset();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/records');
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create entry receipt',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create entry receipt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setEditItem(null);
    setEditIndex(null);
    setItemDialogOpen(true);
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

  // Get filtered subtypes based on selected product type
  const getFilteredSubTypes = (productTypeId: number) => {
    return productSubTypes.filter((st) => st.productTypeId === productTypeId);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6  flex flex-col"
      >
        {/* Header Information */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <div className="flex flex-col gap-2">
              <FormLabel>Receipt Number</FormLabel>
              <div className="flex h-10 items-center px-3 rounded-md border border-input bg-muted">
                <Receipt className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Auto-generated</span>
              </div>
            </div>

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

        {/* Items */}
        <div className="flex w-full items-center justify-end">
          <Button onClick={addItem} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Items table */}
        <ItemTable
          control={form.control}
          register={form.register}
          watch={form.watch}
          setValue={form.setValue}
          fields={fields}
          remove={remove}
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
        />

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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
