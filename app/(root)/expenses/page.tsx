'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExpenseList } from '@/components/expense/expense-list';
import { CategoryList } from '@/components/expense/category-list';

export default function ExpensesPage() {
  return (
    <div className="w-full h-full bg-white rounded-xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
