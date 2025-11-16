'use client';

import { format } from 'date-fns';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import type { ClearanceReceiptFormData } from '@/schema/clearance';

interface ClearanceFormFieldsProps {
  form: UseFormReturn<ClearanceReceiptFormData>;
  onCustomerChange: (customerId: number | undefined) => void;
}

export function ClearanceFormFields({
  form,
  onCustomerChange,
}: ClearanceFormFieldsProps) {
  return (
    <div className="space-y-4">
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
                    onCustomerChange(value);
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

      <div className="grid grid-cols-1 gap-4">
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
  );
}
