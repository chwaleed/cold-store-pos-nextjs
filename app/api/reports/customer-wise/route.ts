import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');

    if (!fromDateStr || !toDateStr) {
      return NextResponse.json(
        { error: 'From date and to date are required' },
        { status: 400 }
      );
    }

    const startDate = startOfDay(new Date(fromDateStr));
    const endDate = endOfDay(new Date(toDateStr));

    // Get all customers who have transactions in the date range
    const customers = await db.customer.findMany({
      where: {
        OR: [
          {
            entryReceipts: {
              some: {
                entryDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
          {
            clearanceReceipts: {
              some: {
                clearanceDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        ],
      },
      include: {
        entryReceipts: {
          where: {
            entryDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            items: true,
          },
        },
        clearanceReceipts: {
          where: {
            clearanceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            clearedItems: true,
          },
        },
        ledger: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    // Process customer data
    const customerData = customers.map((customer) => {
      // Calculate entry quantity
      const entryQuantity = customer.entryReceipts.reduce(
        (total, receipt) =>
          total + receipt.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      );

      // Calculate cleared quantity
      const clearedQuantity = customer.clearanceReceipts.reduce(
        (total, receipt) =>
          total +
          receipt.clearedItems.reduce(
            (sum, item) => sum + item.clearQuantity,
            0
          ),
        0
      );

      // Calculate remaining quantity
      const remainingQuantity = entryQuantity - clearedQuantity;

      // Calculate balance from ledger
      const balance = customer.ledger.reduce(
        (sum, entry) => sum + entry.debitAmount - entry.creditAmount,
        0
      );

      return {
        id: customer.id,
        name: customer.name,
        entryQuantity,
        clearedQuantity,
        remainingQuantity,
        balance,
      };
    });

    // Calculate summary statistics
    const summary = {
      totalCustomers: customerData.length,
      totalEntryQuantity: customerData.reduce(
        (sum, customer) => sum + customer.entryQuantity,
        0
      ),
      totalClearedQuantity: customerData.reduce(
        (sum, customer) => sum + customer.clearedQuantity,
        0
      ),
      totalBalance: customerData.reduce(
        (sum, customer) => sum + customer.balance,
        0
      ),
    };

    // Sort customers by name
    customerData.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      customers: customerData,
      summary,
      filters: {
        fromDate: fromDateStr,
        toDate: toDateStr,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching customer-wise report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer-wise report' },
      { status: 500 }
    );
  }
}
