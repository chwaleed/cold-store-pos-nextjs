'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyReport } from '@/components/reports/daily-report';
import { DateRangeReport } from '@/components/reports/date-range-report';
import { StockSummaryReport } from '@/components/reports/stock-summary-report';

export default function ReportsPage() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate business insights and reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="range">Date Range</TabsTrigger>
          <TabsTrigger value="stock">Stock Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Transactions Report</CardTitle>
              <CardDescription>
                View all transactions for a specific date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="range" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date Range Report</CardTitle>
              <CardDescription>
                View transactions within a date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DateRangeReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Summary Report</CardTitle>
              <CardDescription>
                Current stock grouped by room and type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockSummaryReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
