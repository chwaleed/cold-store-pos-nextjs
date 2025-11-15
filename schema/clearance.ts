import { z } from 'zod';

// Cleared Item schema
export const clearedItemSchema = z.object({
  entryItemId: z.number().int().positive('Entry item is required'),
  clearQuantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .refine((val) => val > 0, {
      message: 'Quantity cleared must be greater than 0',
    }),
  clearKjQuantity: z
    .number()
    .nonnegative('KJ quantity cannot be negative')
    .optional()
    .nullable(),
});

// Clearance Receipt schema
export const clearanceReceiptSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  carNo: z.string().min(1, 'Car number is required'), // ✅ Added validation message
  clearanceDate: z.date(),
  receiptNo: z.string().min(1, 'Receipt number is required'), // ✅ Added validation message
  description: z.string().optional(),
  items: z
    .array(clearedItemSchema)
    .min(1, 'At least one cleared item is required'),
});

// Type exports
export type ClearedItemFormData = z.infer<typeof clearedItemSchema>;
export type ClearanceReceiptFormData = z.infer<typeof clearanceReceiptSchema>;
