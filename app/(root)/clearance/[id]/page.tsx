'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClearanceReceipt } from '@/types/clearance';

export default function ClearanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [clearance, setClearance] = useState<ClearanceReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClearance = async () => {
      if (params.id) {
        await fetchClearance(params.id as string);
      }
    };
    loadClearance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchClearance = async (id: string) => {
    try {
      const response = await fetch(`/api/clearance/${id}`);
      const data = await response.json();

      if (data.success) {
        setClearance(data.data);
      } else {
        router.push('/clearance');
      }
    } catch (error) {
      console.error('Failed to fetch clearance:', error);
      router.push('/clearance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clearance) {
    return null;
  }

  return (
    <div className=" py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clearance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {clearance.clearanceNo}
            </h1>
            <p className="text-muted-foreground">Clearance Details</p>
          </div>
        </div>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      {/* Clearance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Clearance Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Clearance Number</p>
            <p className="font-semibold">{clearance.clearanceNo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-semibold">{clearance.customer?.name || 'N/A'}</p>
            {clearance.customer?.village && (
              <p className="text-sm text-muted-foreground">
                {clearance.customer.village}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entry Receipt</p>
            <p className="font-semibold">
              {clearance.entryReceipt?.receiptNo || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clearance Date</p>
            <p className="font-semibold">
              {new Date(clearance.clearanceDate).toLocaleDateString()}
            </p>
          </div>
          {clearance.carNo && (
            <div>
              <p className="text-sm text-muted-foreground">Car Number</p>
              <p className="font-semibold">{clearance.carNo}</p>
            </div>
          )}
          {clearance.description && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-semibold">{clearance.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleared Items */}
      <Card>
        <CardHeader>
          <CardTitle>Cleared Items</CardTitle>
          <CardDescription>
            Items removed from storage in this clearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Pack / Room</TableHead>
                <TableHead>Box / Marka</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">KJ Qty</TableHead>
                <TableHead className="text-right">Days Stored</TableHead>
                <TableHead className="text-right">Rent/Day</TableHead>
                <TableHead className="text-right">Total Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clearance.clearedItems?.map((item, index) => {
                const entryItem = item.entryItem;
                const productName = entryItem?.productSubType
                  ? `${entryItem.productType?.name || 'N/A'} - ${entryItem.productSubType.name}`
                  : entryItem?.productType?.name || 'N/A';

                return (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {productName}
                      {entryItem?.hasKhaliJali && (
                        <Badge variant="secondary" className="ml-2">
                          KJ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entryItem?.packType?.name || 'N/A'} /{' '}
                      {entryItem?.room?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {entryItem?.boxNo || '-'} / {entryItem?.marka || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantityCleared}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.kjQuantityCleared || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{item.daysStored} days</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      PKR {item.rentPerDay.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      PKR {item.totalRent.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="space-y-2 min-w-[300px]">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Items:</span>
                <Badge variant="secondary">
                  {clearance.clearedItems?.length || 0} items
                </Badge>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold text-lg">Total Rent:</span>
                <span className="font-bold text-2xl text-primary">
                  PKR {clearance.totalRent.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
