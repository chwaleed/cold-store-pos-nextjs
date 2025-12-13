import { z } from 'zod';

// Cleared Item schema
// Note: clearKjQuantity is optional and can be different from clearQuantity
// Allows scenarios like: 10 packs stored with 50 KJ units
// Either clearQuantity OR clearKjQuantity must be > 0 (can clear just one type)
export const clearedItemSchema = z
  .object({
    entryItemId: z.number().int().positive('Entry item is required'),
    clearQuantity: z.number().nonnegative('Quantity cannot be negative'),
    clearKjQuantity: z
      .number()
      .nonnegative('KJ quantity cannot be negative')
      .optional()
      .nullable(),
  })
  .refine((data) => data.clearQuantity > 0 || (data.clearKjQuantity ?? 0) > 0, {
    message:
      'At least one of clearQuantity or clearKjQuantity must be greater than 0',
    path: ['clearQuantity'],
  });

// Clearance Receipt schema
export const clearanceReceiptSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  carNo: z.string().min(1, 'Car number is required'), // ✅ Added validation message
  clearanceDate: z.date(),
  receiptNo: z.string().min(1, 'Receipt number is required'), // ✅ Added validation message
  description: z.string().optional(),

  paymentAmount: z
    .number()
    .nonnegative('Payment amount cannot be negative')
    .optional()
    .default(0),
  discountAmount: z
    .number()
    .nonnegative('Discount amount cannot be negative')
    .optional()
    .default(0),
  items: z
    .array(clearedItemSchema)
    .min(1, 'At least one cleared item is required'),
});

// Type exports
export type ClearedItemFormData = z.infer<typeof clearedItemSchema>;
export type ClearanceReceiptFormData = z.infer<typeof clearanceReceiptSchema>;
