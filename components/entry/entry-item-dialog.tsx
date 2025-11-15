'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox, CheckboxIndicator } from '@radix-ui/react-checkbox';
import { entryItemSchema, EntryItemFormData } from '@/schema/entry';
import { ProductType, ProductSubType, Room, PackType } from '@/types/config';
import { Loader2 } from 'lucide-react';

interface EntryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: EntryItemFormData) => void;
  editItem?: EntryItemFormData & { index?: number };
  productTypes: ProductType[];
  productSubTypes: ProductSubType[];
  rooms: Room[];
  packTypes: PackType[];
}

export function EntryItemDialog({
  open,
  onOpenChange,
  onAdd,
  editItem,
  productTypes,
  productSubTypes,
  rooms,
  packTypes,
}: EntryItemDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EntryItemFormData>({
    resolver: zodResolver(entryItemSchema),
    defaultValues: {
      productTypeId: 0,
      productSubTypeId: null,
      packTypeId: 0,
      roomId: 0,
      boxNo: '',
      marka: '',
      quantity: 0,
      unitPrice: 0,
      hasKhaliJali: false,
      kjQuantity: null,
      kjUnitPrice: null,
    },
  });

  // Update form when editing
  useEffect(() => {
    if (editItem) {
      form.reset(editItem);
    } else {
      form.reset({
        productTypeId: 0,
        productSubTypeId: null,
        packTypeId: 0,
        roomId: 0,
        boxNo: '',
        marka: '',
        quantity: 0,
        unitPrice: 0,
        hasKhaliJali: false,
        kjQuantity: null,
        kjUnitPrice: null,
      });
    }
  }, [editItem, form]);

  const onSubmit = async (data: EntryItemFormData) => {
    setSubmitting(true);
    try {
      onAdd(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Get filtered subtypes based on selected product type
  const getFilteredSubTypes = (productTypeId: number) => {
    return productSubTypes.filter((st) => st.productTypeId === productTypeId);
  };

  const selectedTypeId = form.watch('productTypeId');
  const filteredSubTypes = getFilteredSubTypes(selectedTypeId);

  const hasKhaliJali = form.watch('hasKhaliJali');
  const quantity = form.watch('quantity') || 0;
  const unitPrice = form.watch('unitPrice') || 0;
  const kjQuantity = form.watch('kjQuantity') || 0;
  const kjUnitPrice = form.watch('kjUnitPrice') || 0;

  const itemTotal = quantity * unitPrice;
  const kjTotal = hasKhaliJali ? kjQuantity * kjUnitPrice : 0;
  const grandTotal = itemTotal + kjTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Item' : 'Add Entry Item'}</DialogTitle>
          <DialogDescription>
            {editItem
              ? 'Update the item details'
              : 'Add a new item to the entry receipt'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="productTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        form.setValue('productSubTypeId', null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
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
                name="productSubTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product SubType</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : null)
                      }
                      disabled={
                        !selectedTypeId || filteredSubTypes.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubTypes.map((subType) => (
                          <SelectItem
                            key={subType.id}
                            value={subType.id.toString()}
                          >
                            {subType.name}
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
                name="packTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pack Type *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pack" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packTypes.map((pack) => (
                          <SelectItem key={pack.id} value={pack.id.toString()}>
                            {pack.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location & Marking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name} ({room.type})
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
                name="boxNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Box #"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marka</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Marking"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (PKR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <div className="text-sm w-full p-3 bg-muted rounded-md">
                  <span className="text-muted-foreground">Item Subtotal: </span>
                  <span className="font-semibold">
                    PKR {itemTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Khali Jali Section */}
            <div className="space-y-4  p-4 rounded-lg border">
              <FormField
                control={form.control}
                name="hasKhaliJali"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="w-5 h-5 border rounded-sm"
                      >
                        <CheckboxIndicator>
                          <svg
                            className="w-4 h-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.285 6.707a1 1 0 00-1.414-1.414l-9.192 9.192-4.243-4.243a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l10-10z" />
                          </svg>
                        </CheckboxIndicator>
                      </Checkbox>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Khali Jali</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasKhaliJali && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="kjQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KJ Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kjUnitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KJ Unit Price (PKR) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <div className="text-sm w-full p-3 bg-background rounded-md">
                      <span className="text-muted-foreground">KJ Total: </span>
                      <span className="font-semibold">
                        PKR {kjTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-end pt-2">
              <div className="text-lg font-bold">
                Item Total: PKR {grandTotal.toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editItem ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
