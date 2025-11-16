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
    subType: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    customerId: '',
  });

  return (
    <div className="w-full h-full bg-white rounded-xl space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            View current stock levels and locations
          </p>
        </div>
      </div>
      <div>
        <InventoryFilters filters={filters} setFilters={setFilters} />
      </div>
      <InventoryTable filters={filters} />
    </div>
  );
}
