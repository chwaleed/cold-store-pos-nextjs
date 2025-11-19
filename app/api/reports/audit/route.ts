import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period'); // 'month' | 'year'
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
      case 'month':
        startDate = startOfMonth(referenceDate);
        endDate = endOfMonth(referenceDate);
        break;
      case 'year':
        startDate = startOfYear(referenceDate);
        endDate = endOfYear(referenceDate);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid period. Use month or year' },
          { status: 400 }
        );
    }

    // 1. Total Entry Amount and Quantity
    const entries = await db.entryReceipt.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const totalEntryAmount = entries.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalEntryQuantity = entries.reduce(
      (sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );
    const totalEntryReceipts = entries.length;

    // 2. Total Clearance Amount and Quantity
    const clearances = await db.clearanceReceipt.findMany({
      where: {
        clearanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        clearedItems: true,
      },
    });

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
    const totalClearanceReceipts = clearances.length;

    // 3. Total Expenses
    const expenses = await db.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory: Record<string, number> = {};

    expenses.forEach((expense) => {
      const categoryName = expense.category.name;
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = 0;
      }
      expensesByCategory[categoryName] += expense.amount;
    });

    // 4. Current Inventory Value (all items with remaining quantity)
    const inventoryItems = await db.entryItem.findMany({
      where: {
        remainingQuantity: {
          gt: 0,
        },
      },
      include: {
        productType: true,
        productSubType: true,
        room: true,
      },
    });

    const totalInventoryValue = inventoryItems.reduce(
      (sum, item) => sum + item.remainingQuantity * item.unitPrice,
      0
    );
    const totalKjValue = inventoryItems.reduce(
      (sum, item) =>
        sum + (item.remainingKjQuantity ?? 0) * (item.kjUnitPrice ?? 0),
      0
    );

    const totalInventoryQuantity = inventoryItems.reduce(
      (sum, item) => sum + item.remainingQuantity,
      0
    );

    // 5. Customer Payments (Credit Entries in Ledger)
    const payments = await db.ledger.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        creditAmount: {
          gt: 0,
        },
      },
    });

    const totalPaymentsReceived = payments.reduce(
      (sum, p) => sum + p.creditAmount,
      0
    );

    // 6. Outstanding Balance (All time ledger balance)
    const allLedgerEntries = await db.ledger.findMany();
    const totalOutstanding = allLedgerEntries.reduce(
      (sum, entry) => sum + entry.debitAmount - entry.creditAmount,
      0
    );

    // 7. Profit/Loss Calculation
    // Revenue = Total Clearance Amount (what we charged customers)
    // Costs = Total Entry Amount (what we stored for customers) + Expenses
    // Note: In a cold storage business, we charge for storage, not for selling goods
    // So profit = Clearance charges + Entry charges - Expenses
    const totalRevenue = totalEntryAmount;
    const totalCosts = totalExpenses;
    const profitLoss = totalRevenue - totalCosts;

    // 8. Customer Statistics
    const customersWithActivity = await db.customer.findMany({
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
    });

    // 9. Room Utilization
    const roomStats = await db.room.findMany({
      include: {
        entryItems: {
          where: {
            remainingQuantity: {
              gt: 0,
            },
          },
        },
      },
    });

    const roomUtilization = roomStats.map((room) => ({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      currentItems: room.entryItems.length,
      currentQuantity: room.entryItems.reduce(
        (sum, item) => sum + item.remainingQuantity,
        0
      ),
    }));

    return NextResponse.json({
      period: {
        type: period,
        startDate,
        endDate,
        year: referenceDate.getFullYear(),
        month: period === 'month' ? referenceDate.getMonth() + 1 : null,
      },
      entry: {
        totalAmount: totalEntryAmount,
        totalQuantity: totalEntryQuantity,
        totalReceipts: totalEntryReceipts,
      },
      clearance: {
        totalAmount: totalClearanceAmount,
        totalQuantity: totalClearanceQuantity,
        totalReceipts: totalClearanceReceipts,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        count: expenses.length,
      },
      inventory: {
        totalValue: totalInventoryValue + totalKjValue,
        totalQuantity: totalInventoryQuantity,
        itemCount: inventoryItems.length,
      },
      financial: {
        totalRevenue,
        totalCosts,
        profitLoss,
        profitMargin:
          totalRevenue > 0
            ? ((profitLoss / totalRevenue) * 100).toFixed(2)
            : '0.00',
        paymentsReceived: totalPaymentsReceived,
        outstandingBalance: totalOutstanding,
      },
      customers: {
        activeCount: customersWithActivity.length,
      },
      rooms: {
        utilization: roomUtilization,
      },
    });
  } catch (error) {
    console.error('Error fetching audit report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit report' },
      { status: 500 }
    );
  }
}
