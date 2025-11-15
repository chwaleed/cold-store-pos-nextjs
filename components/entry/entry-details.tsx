'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { EntryReceiptWithDetails } from '@/types/entry';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface EntryDetailsProps {
  entryId: number;
}

export function EntryDetails({ entryId }: EntryDetailsProps) {
  const [entry, setEntry] = useState<EntryReceiptWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/entry/${entryId}`);
        const result = await response.json();

        if (result.success) {
          setEntry(result.data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entry details',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch entry details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId, toast]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Entry receipt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.push('/records')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Entries
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                Entry Receipt: {entry.receiptNo}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(entry.entryDate)}
              </p>
            </div>
            <Badge variant="default" className="text-base">
              In Storage
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{entry.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Car Number</p>
              <p className="font-medium">{entry.carNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{entry.items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">PKR {entry.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {entry.customer.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{entry.customer.phone}</p>
            </div>
          )}

          {entry.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{entry.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Pack Type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Box/Marka</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.items.map((item, index) => (
                <>
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.productType?.name || 'N/A'}
                        </p>
                        {item.productSubType && (
                          <p className="text-sm text-muted-foreground">
                            {item.productSubType.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.packType?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {item.room?.name || 'N/A'}
                      <Badge variant="outline" className="ml-2">
                        {item.room?.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.boxNo && <p>Box: {item.boxNo}</p>}
                        {item.marka && <p>Marka: {item.marka}</p>}
                        {!item.boxNo && !item.marka && <p>-</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      PKR {item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      PKR {item.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.remainingQuantity === 0 ? 'outline' : 'default'
                        }
                      >
                        {item.remainingQuantity}
                      </Badge>
                    </TableCell>
                  </TableRow>

                  {/* Khali Jali Row */}
                  {item.hasKhaliJali && item.kjQuantity && (
                    <TableRow className="bg-muted/50">
                      <TableCell></TableCell>
                      <TableCell colSpan={4} className="text-sm italic">
                        Khali Jali (Empty Crate)
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.kjQuantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        PKR {item.kjUnitPrice?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        PKR {item.kjTotal?.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}

                  {/* Item Grand Total */}
                  {item.hasKhaliJali && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-right font-medium">
                        Item Total:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        PKR {item.grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="text-right space-y-2">
              <div className="text-2xl font-bold">
                Grand Total: PKR {entry.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(entry.createdAt)}</p>
            </div>
            <div className="text-right">
              <p>Last Updated: {formatDate(entry.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
