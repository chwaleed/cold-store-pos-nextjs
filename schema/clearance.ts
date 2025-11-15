import { z } from 'zod';

// Cleared Item schema
export const clearedItemSchema = z.object({
  entryItemId: z.number().int().positive('Entry item is required'),
  quantityCleared: z
    .number()
    .positive('Quantity must be greater than 0')
    .refine((val) => val > 0, {
      message: 'Quantity cleared must be greater than 0',
    }),
  kjQuantityCleared: z
    .number()
    .nonnegative('KJ quantity cannot be negative')
    .optional()
    .nullable(),
});

// Clearance Receipt schema
export const clearanceReceiptSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  entryReceiptNo: z.string().min(1, 'Entry receipt number is required'),
  carNo: z.string().optional(),
  clearanceDate: z.date().optional(),
  description: z.string().optional(),
  items: z
    .array(clearedItemSchema)
    .min(1, 'At least one item must be cleared')
    .refine(
      (items) => {
        // Ensure no duplicate entryItemId
        const itemIds = items.map((item) => item.entryItemId);
        return itemIds.length === new Set(itemIds).size;
      },
      {
        message: 'Cannot clear the same item multiple times',
      }
    ),
});

// Type exports
export type ClearedItemFormData = z.infer<typeof clearedItemSchema>;
export type ClearanceReceiptFormData = z.infer<typeof clearanceReceiptSchema>;
