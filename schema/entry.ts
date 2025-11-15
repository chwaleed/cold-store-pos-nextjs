import { z } from 'zod';

// Entry Item Schema
export const entryItemSchema = z
  .object({
    productTypeId: z.number().int().positive('Product type is required'),
    productSubTypeId: z.number().int().positive().optional().nullable(),
    packTypeId: z.number().int().positive('Pack type is required'),
    roomId: z.number().int().positive('Room is required'),
    boxNo: z.string().optional().nullable(),
    marka: z.string().optional().nullable(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unitPrice: z.number().nonnegative('Unit price must be 0 or greater'),

    // Khali Jali fields
    hasKhaliJali: z.boolean().default(false),
    kjQuantity: z.number().positive().optional().nullable(),
    kjUnitPrice: z.number().nonnegative().optional().nullable(),
  })
  .refine(
    (data) => {
      // If hasKhaliJali is true, kjQuantity and kjUnitPrice must be provided
      if (data.hasKhaliJali) {
        return (
          data.kjQuantity != null &&
          data.kjQuantity > 0 &&
          data.kjUnitPrice != null &&
          data.kjUnitPrice >= 0
        );
      }
      return true;
    },
    {
      message:
        'Khali Jali quantity and unit price are required when Khali Jali is enabled',
      path: ['hasKhaliJali'],
    }
  );

// Entry Receipt Schema
export const entryReceiptSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  carNo: z.string().min(1, 'Car number is required'),
  receiptNo: z.string().min(1, 'Receipt number is required'),
  entryDate: z.string().or(z.date()).optional(),
  description: z.string().optional().nullable(),
  items: z.array(entryItemSchema).min(1, 'At least one item is required'),
});

export const updateEntryReceiptSchema = entryReceiptSchema.partial();

// Type exports
export type EntryItemFormData = z.infer<typeof entryItemSchema>;
export type EntryReceiptFormData = z.infer<typeof entryReceiptSchema>;
