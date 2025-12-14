'use client';

import { CashBookPage } from '@/components/cash-book/cash-book-page';
import { CashBookReports } from '@/components/cash-book/cash-book-reports';
import { CashBookErrorBoundary } from '@/components/cash-book/cash-book-error-boundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CashBook() {
  return (
    <CashBookErrorBoundary>
      <div className="container bg-background rounded-2xl  p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Cash Book</h1>
          <p className="text-muted-foreground">
            Manage daily cash transactions and generate reports
          </p>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Daily Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-6">
            <CashBookPage />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <CashBookReports />
          </TabsContent>
        </Tabs>
      </div>
    </CashBookErrorBoundary>
  );
}
