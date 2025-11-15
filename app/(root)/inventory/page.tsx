'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { InventoryFilters } from '@/components/inventory/inventory-filters';

export default function InventoryPage() {
  const [filters, setFilters] = useState({
    room: 'all',
    type: 'all',
    marka: '',
    dateFrom: '',
    dateTo: '',
    showZeroStock: false,
  });

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            View current stock levels and locations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter inventory by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryFilters filters={filters} setFilters={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
          <CardDescription>
            Real-time inventory levels with pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
