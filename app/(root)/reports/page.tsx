'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyReport } from '@/components/reports/daily-report';
import { DateRangeReport } from '@/components/reports/date-range-report';
import { CustomerWiseReport } from '@/components/reports/customer-wise-report';
import { ExpenseReport } from '@/components/reports/expense-report';
import { AuditReport } from '@/components/reports/audit-report';

export default function ReportsPage() {
  return (
    <div className="w-full h-full bg-background rounded-xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive business insights and reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid w-full max-w-5xl grid-cols-5">
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="customer-wise">Customer-Wise</TabsTrigger>
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4">
          <DailyReport />
        </TabsContent>

        <TabsContent value="customer-wise" className="space-y-4">
          <CustomerWiseReport />
        </TabsContent>

        <TabsContent value="overall" className="space-y-4">
          <DateRangeReport />
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <ExpenseReport />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
