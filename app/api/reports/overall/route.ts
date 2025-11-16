import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productTypeId = searchParams.get('productTypeId');
    const productSubTypeId = searchParams.get('productSubTypeId');
    const period = searchParams.get('period'); // 'day' | 'month' | 'year'
    const date = searchParams.get('date'); // ISO date string

    if (!date || !period) {
      return NextResponse.json(
        { error: 'Date and period are required' },
        { status: 400 }
      );
    }

    const referenceDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(referenceDate);
        endDate = endOfDay(referenceDate);
        break;
      case 'month':
        startDate = startOfMonth(referenceDate);
        endDate = endOfMonth(referenceDate);
        break;
      case 'year':
        startDate = startOfYear(referenceDate);
        endDate = endOfYear(referenceDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    // Fetch all entries in period
    const entries = await db.entryReceipt.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            productType: true,
            productSubType: true,
            packType: true,
            room: true,
          },
          where: {
            ...(productTypeId && { productTypeId: parseInt(productTypeId) }),
            ...(productSubTypeId && {
              productSubTypeId: parseInt(productSubTypeId),
            }),
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });

    // Fetch all clearances in period
    const clearances = await db.clearanceReceipt.findMany({
      where: {
        clearanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        clearedItems: {
          include: {
            entryItem: {
              include: {
                productType: true,
                productSubType: true,
                packType: true,
                room: true,
              },
            },
          },
          where: {
            entryItem: {
              ...(productTypeId && { productTypeId: parseInt(productTypeId) }),
              ...(productSubTypeId && {
                productSubTypeId: parseInt(productSubTypeId),
              }),
            },
          },
        },
      },
      orderBy: { clearanceDate: 'desc' },
    });

    // Calculate totals
    const totalEntryAmount = entries.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalEntryQuantity = entries.reduce(
      (sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );

    const totalClearanceAmount = clearances.reduce(
      (sum, r) => sum + r.totalAmount,
      0
    );
    const totalClearanceQuantity = clearances.reduce(
      (sum, r) =>
        sum +
        r.clearedItems.reduce((itemSum, i) => itemSum + i.clearQuantity, 0),
      0
    );

    // Group by product type
    const entryByType: Record<string, { quantity: number; amount: number }> =
      {};
    const clearanceByType: Record<
      string,
      { quantity: number; amount: number }
    > = {};

    entries.forEach((entry) => {
      entry.items.forEach((item) => {
        const typeName = item.productType.name;
        if (!entryByType[typeName]) {
          entryByType[typeName] = { quantity: 0, amount: 0 };
        }
        entryByType[typeName].quantity += item.quantity;
        entryByType[typeName].amount += item.totalPrice;
      });
    });

    clearances.forEach((clearance) => {
      clearance.clearedItems.forEach((item) => {
        const typeName = item.entryItem.productType.name;
        if (!clearanceByType[typeName]) {
          clearanceByType[typeName] = { quantity: 0, amount: 0 };
        }
        clearanceByType[typeName].quantity += item.clearQuantity;
        clearanceByType[typeName].amount += item.totalAmount;
      });
    });

    return NextResponse.json({
      entries,
      clearances,
      summary: {
        totalEntryAmount,
        totalEntryQuantity,
        totalClearanceAmount,
        totalClearanceQuantity,
        entryByType,
        clearanceByType,
      },
      filters: {
        period,
        date,
        productTypeId,
        productSubTypeId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching overall report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall report' },
      { status: 500 }
    );
  }
}
