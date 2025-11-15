'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClearanceReceipt } from '@/types/clearance';

export function ClearanceTable() {
  const [clearances, setClearances] = useState<ClearanceReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClearances();
  }, []);

  const fetchClearances = async () => {
    try {
      const response = await fetch('/api/clearance');
      const data = await response.json();

      if (data.success) {
        setClearances(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clearances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (clearances.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No clearances found</h3>
        <p className="text-muted-foreground mb-4">
          Start by creating your first clearance
        </p>
        <Button asChild>
          <Link href="/clearance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Clearance
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Clearance No.</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Entry Receipt</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total Rent</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clearances.map((clearance) => (
          <TableRow key={clearance.id}>
            <TableCell className="font-medium">
              {clearance.clearanceNo}
            </TableCell>
            <TableCell>
              {clearance.customer?.name || 'N/A'}
              {clearance.customer?.village && (
                <span className="text-sm text-muted-foreground">
                  {' '}
                  - {clearance.customer.village}
                </span>
              )}
            </TableCell>
            <TableCell>{clearance.entryReceipt?.receiptNo || 'N/A'}</TableCell>
            <TableCell>
              {new Date(clearance.clearanceDate).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {clearance.clearedItems?.length || 0} items
              </Badge>
            </TableCell>
            <TableCell className="text-right font-semibold">
              PKR {clearance.totalRent.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/clearance/${clearance.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
