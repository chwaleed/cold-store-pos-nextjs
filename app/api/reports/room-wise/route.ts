import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const mode = searchParams.get('mode') || 'customer'; // 'customer', 'product', or 'both'
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const roomIdInt = parseInt(roomId);

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomIdInt },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Build date filter
    const dateFilter: any = {};
    if (fromDate && toDate) {
      dateFilter.entryDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    const result: any = {};

    // Customer-wise report
    if (mode === 'customer' || mode === 'both') {
      const entryItems = await prisma.entryItem.findMany({
        where: {
          roomId: roomIdInt,
          entryReceipt: dateFilter,
        },
        include: {
          entryReceipt: {
            include: {
              customer: true,
            },
          },
          clearedItems: true,
        },
      });

      // Group by customer
      const customerMap = new Map<
        number,
        {
          customerName: string;
          stockEntered: number;
          stockCleared: number;
          remainingStock: number;
        }
      >();

      entryItems.forEach((item) => {
        const customerId = item.entryReceipt.customerId;
        const customerName = item.entryReceipt.customer.name;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerName,
            stockEntered: 0,
            stockCleared: 0,
            remainingStock: 0,
          });
        }

        const customerData = customerMap.get(customerId)!;
        customerData.stockEntered += item.quantity;

        // Calculate cleared quantity for this item
        const clearedQty = item.clearedItems.reduce(
          (sum, cleared) => sum + cleared.clearQuantity,
          0
        );
        customerData.stockCleared += clearedQty;
        customerData.remainingStock += item.remainingQuantity;
      });

      result.customerWise = Array.from(customerMap.values()).sort((a, b) =>
        a.customerName.localeCompare(b.customerName)
      );
    }

    // Product-wise report
    if (mode === 'product' || mode === 'both') {
      const entryItems = await prisma.entryItem.findMany({
        where: {
          roomId: roomIdInt,
          entryReceipt: dateFilter,
        },
        include: {
          productType: true,
          productSubType: true,
          clearedItems: true,
        },
      });

      // Group by product type and subtype
      const productMap = new Map<
        string,
        {
          productType: string;
          productSubType: string | null;
          enteredQuantity: number;
          clearedQuantity: number;
          remainingQuantity: number;
        }
      >();

      entryItems.forEach((item) => {
        const key = `${item.productTypeId}-${item.productSubTypeId || 'null'}`;

        if (!productMap.has(key)) {
          productMap.set(key, {
            productType: item.productType.name,
            productSubType: item.productSubType?.name || null,
            enteredQuantity: 0,
            clearedQuantity: 0,
            remainingQuantity: 0,
          });
        }

        const productData = productMap.get(key)!;
        productData.enteredQuantity += item.quantity;

        // Calculate cleared quantity for this item
        const clearedQty = item.clearedItems.reduce(
          (sum, cleared) => sum + cleared.clearQuantity,
          0
        );
        productData.clearedQuantity += clearedQty;
        productData.remainingQuantity += item.remainingQuantity;
      });

      result.productWise = Array.from(productMap.values()).sort((a, b) => {
        const typeCompare = a.productType.localeCompare(b.productType);
        if (typeCompare !== 0) return typeCompare;

        const aSubType = a.productSubType || '';
        const bSubType = b.productSubType || '';
        return aSubType.localeCompare(bSubType);
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating room-wise report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
