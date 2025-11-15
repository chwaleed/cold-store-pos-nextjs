import { z } from 'zod';

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fatherName: z.string().optional(),
  // CNIC removed; no longer validated or saved
  phone: z
    .string()
    .regex(/^(\+92|0)?[0-9]{10}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  village: z.string().optional(),
});

export const updateCustomerSchema = customerSchema.partial();

export type CustomerFormData = z.infer<typeof customerSchema>;
