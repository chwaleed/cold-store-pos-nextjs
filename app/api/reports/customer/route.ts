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
    const customerId = searchParams.get('customerId');
    const productTypeId = searchParams.get('productTypeId');
    const productSubTypeId = searchParams.get('productSubTypeId');
    const reportType = searchParams.get('reportType'); // 'entry' | 'clearance' | 'both'
    const period = searchParams.get('period'); // 'day' | 'month' | 'year' | 'lifetime'
    const date = searchParams.get('date'); // ISO date string

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Calculate date range based on period
    if (date && period !== 'lifetime') {
      const referenceDate = new Date(date);

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
      }
    }

    const customer = await db.customer.findUnique({
      where: { id: parseInt(customerId) },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    let entryData = null;
    let clearanceData = null;

    // Fetch entry data if needed
    if (reportType === 'entry' || reportType === 'both') {
      const entryWhere: any = {
        customerId: parseInt(customerId),
      };

      if (startDate && endDate) {
        entryWhere.entryDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const entries = await db.entryReceipt.findMany({
        where: entryWhere,
        include: {
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

      entryData = {
        receipts: entries,
        totalAmount: entries.reduce((sum, r) => sum + r.totalAmount, 0),
        totalQuantity: entries.reduce(
          (sum, r) =>
            sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
          0
        ),
      };
    }

    // Fetch clearance data if needed
    if (reportType === 'clearance' || reportType === 'both') {
      const clearanceWhere: any = {
        customerId: parseInt(customerId),
      };

      if (startDate && endDate) {
        clearanceWhere.clearanceDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const clearances = await db.clearanceReceipt.findMany({
        where: clearanceWhere,
        include: {
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
                ...(productTypeId && {
                  productTypeId: parseInt(productTypeId),
                }),
                ...(productSubTypeId && {
                  productSubTypeId: parseInt(productSubTypeId),
                }),
              },
            },
          },
        },
        orderBy: { clearanceDate: 'desc' },
      });

      clearanceData = {
        receipts: clearances,
        totalAmount: clearances.reduce((sum, r) => sum + r.totalAmount, 0),
        totalQuantity: clearances.reduce(
          (sum, r) =>
            sum +
            r.clearedItems.reduce((itemSum, i) => itemSum + i.clearQuantity, 0),
          0
        ),
      };
    }

    // Calculate balance from ledger
    const ledger = await db.ledger.findMany({
      where: {
        customerId: parseInt(customerId),
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      orderBy: { createdAt: 'asc' },
    });

    const balance = ledger.reduce(
      (sum, entry) => sum + entry.debitAmount - entry.creditAmount,
      0
    );

    return NextResponse.json({
      customer,
      entryData,
      clearanceData,
      ledger,
      balance,
      filters: {
        period,
        date,
        reportType,
        productTypeId,
        productSubTypeId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching customer report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer report' },
      { status: 500 }
    );
  }
}
