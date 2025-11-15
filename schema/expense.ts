import * as z from 'zod';

// Expense Category Schema
export const expenseCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .min(1, 'Category name cannot be empty'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;

// Expense Schema
export const expenseSchema = z.object({
  date: z.date().default(() => new Date()),
  categoryId: z.number().int().positive('Please select a category'),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .min(0.01, 'Amount must be at least 0.01'),
  description: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// Expense with relations
export interface Expense {
  id: number;
  date: Date;
  categoryId: number;
  amount: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: ExpenseCategory;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
