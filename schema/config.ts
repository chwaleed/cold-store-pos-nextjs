import { z } from 'zod';

// ProductType schemas
export const productTypeSchema = z.object({
  name: z.string().min(1, 'Product type name is required'),
  doubleRentAfter30Days: z.boolean().default(false),
});

export const updateProductTypeSchema = z.object({
  name: z.string().min(1, 'Product type name is required').optional(),
  doubleRentAfter30Days: z.boolean().optional(),
});

// ProductSubType schemas
export const productSubTypeSchema = z.object({
  name: z.string().min(1, 'Product subtype name is required'),
  productTypeId: z.number().int().positive('Product type is required'),
});

export const updateProductSubTypeSchema = z.object({
  name: z.string().min(1, 'Product subtype name is required').optional(),
  productTypeId: z
    .number()
    .int()
    .positive('Product type is required')
    .optional(),
});

// Room schemas
export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.enum(['Cold', 'Hot'], {
    errorMap: () => ({ message: 'Room type must be either Cold or Hot' }),
  }),
  capacity: z
    .number()
    .int()
    .positive('Capacity must be a positive number')
    .optional()
    .nullable(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').optional(),
  type: z
    .enum(['Cold', 'Hot'], {
      errorMap: () => ({ message: 'Room type must be either Cold or Hot' }),
    })
    .optional(),
  capacity: z
    .number()
    .int()
    .positive('Capacity must be a positive number')
    .optional()
    .nullable(),
});

// PackType schemas
export const packTypeSchema = z.object({
  name: z.string().min(1, 'Pack type name is required'),
});

export const updatePackTypeSchema = z.object({
  name: z.string().min(1, 'Pack type name is required').optional(),
});

// Type exports
export type ProductTypeFormData = z.infer<typeof productTypeSchema>;
export type ProductSubTypeFormData = z.infer<typeof productSubTypeSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type PackTypeFormData = z.infer<typeof packTypeSchema>;
