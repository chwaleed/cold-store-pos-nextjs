import { z } from 'zod';

// Enhanced validation helpers
const futureDate = z.coerce.date().refine(
  (date) => {
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day in future
    return date <= maxFutureDate;
  },
  {
    message: 'Date cannot be more than 1 day in the future',
  }
);

const positiveAmount = z
  .number()
  .positive('Amount must be positive')
  .max(999999999, 'Amount is too large')
  .refine(
    (amount) => {
      // Check for reasonable decimal places (max 2)
      const decimalPlaces = (amount.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    },
    {
      message: 'Amount cannot have more than 2 decimal places',
    }
  );

const nonEmptyDescription = z
  .string()
  .min(1, 'Description is required')
  .max(500, 'Description is too long')
  .refine((desc) => desc.trim().length > 0, {
    message: 'Description cannot be only whitespace',
  });

// Manual Transaction Input Schema
export const manualTransactionInputSchema = z.object({
  date: futureDate,
  transactionType: z.enum(['inflow', 'outflow'], {
    errorMap: () => ({
      message: 'Transaction type must be either inflow or outflow',
    }),
  }),
  amount: positiveAmount,
  description: nonEmptyDescription,
  customerId: z.number().int().positive().optional(),
});

// Cash Book Entry Update Schema
export const cashBookEntryUpdateSchema = z.object({
  description: nonEmptyDescription.optional(),
  amount: positiveAmount.optional(),
  customerId: z.number().int().positive().optional(),
});

// Opening Balance Schema
export const openingBalanceSchema = z.object({
  date: z.coerce.date(),
  openingBalance: z
    .number()
    .min(0, 'Opening balance cannot be negative')
    .max(999999999, 'Opening balance is too large'),
  changeReason: z.string().max(200, 'Change reason is too long').optional(),
  changedBy: z.string().max(100, 'Changed by field is too long').optional(),
});

// Date Range Query Schema
export const dateRangeQuerySchema = z
  .object({
    fromDate: z.coerce.date(),
    toDate: z.coerce.date(),
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: 'From date must be before or equal to to date',
    path: ['fromDate'],
  })
  .refine(
    (data) => {
      const daysDiff =
        Math.abs(data.toDate.getTime() - data.fromDate.getTime()) /
        (1000 * 60 * 60 * 24);
      return daysDiff <= 365; // Max 1 year range
    },
    {
      message: 'Date range cannot exceed 365 days',
      path: ['toDate'],
    }
  );

// Cash Book Filters Schema
export const cashBookFiltersSchema = z.object({
  date: z.coerce.date().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  transactionType: z.enum(['inflow', 'outflow', 'all']).optional(),
  source: z
    .enum(['clearance', 'ledger', 'expense', 'manual', 'all'])
    .optional(),
  customerId: z.number().int().positive().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['date', 'amount', 'description']).default('date').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
});

// Daily Summary Update Schema
export const dailySummaryUpdateSchema = z.object({
  openingBalance: z
    .number()
    .min(0, 'Opening balance cannot be negative')
    .max(999999999, 'Opening balance is too large')
    .optional(),
  isReconciled: z.boolean().optional(),
  reconciledBy: z
    .string()
    .max(100, 'Reconciled by field is too long')
    .optional(),
});

// Source Transaction Reference Schema
export const sourceTransactionReferenceSchema = z.object({
  referenceId: z.number().int().positive(),
  referenceType: z.enum(['clearance_receipt', 'ledger_entry', 'expense']),
  source: z.enum(['clearance', 'ledger', 'expense']),
});

export type ManualTransactionInput = z.infer<
  typeof manualTransactionInputSchema
>;
export type CashBookEntryUpdate = z.infer<typeof cashBookEntryUpdateSchema>;
export type OpeningBalanceInput = z.infer<typeof openingBalanceSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type CashBookFilters = z.infer<typeof cashBookFiltersSchema>;
export type DailySummaryUpdate = z.infer<typeof dailySummaryUpdateSchema>;
export type SourceTransactionReference = z.infer<
  typeof sourceTransactionReferenceSchema
>;

// Additional validation schemas for frontend components
export const cashBookStatsQuerySchema = z.object({
  date: z.coerce.date(),
  includeCustomerBreakdown: z.boolean().default(false).optional(),
  includeSourceBreakdown: z.boolean().default(true).optional(),
});

export const bulkTransactionSchema = z.object({
  transactions: z.array(manualTransactionInputSchema).min(1).max(50),
  validateDuplicates: z.boolean().default(true).optional(),
});

export const transactionSearchSchema = z.object({
  query: z.string().min(1).max(100),
  searchFields: z
    .array(z.enum(['description', 'customer', 'source', 'amount']))
    .default(['description'])
    .optional(),
  dateRange: dateRangeQuerySchema.optional(),
  transactionType: z.enum(['inflow', 'outflow', 'all']).optional(),
});

export type CashBookStatsQuery = z.infer<typeof cashBookStatsQuerySchema>;
export type BulkTransactionInput = z.infer<typeof bulkTransactionSchema>;
export type TransactionSearchQuery = z.infer<typeof transactionSearchSchema>;
