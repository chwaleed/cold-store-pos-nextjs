import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'From date and to date are required' },
        { status: 400 }
      );
    }

    const startDate = startOfDay(new Date(fromDate));
    const endDate = endOfDay(new Date(toDate));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'From date cannot be after to date' },
        { status: 400 }
      );
    }

    // 1. Get total entry amount (all inventory added)
    const entryReceipts = await prisma.entryReceipt.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalEntryAmount = entryReceipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );

    // 2. Get total clearance amount (all inventory cleared)
    const clearanceReceipts = await prisma.clearanceReceipt.findMany({
      where: {
        clearanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalClearanceAmount = clearanceReceipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );

    // 3. Get cash received (excluding direct cash/loans)
    // Get all ledger entries with credit amounts
    const allCashReceived = await (prisma as any).ledger.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        creditAmount: {
          gt: 0,
        },
      },
      select: {
        creditAmount: true,
        type: true,
        isDirectCash: true,
      },
    });

    // Filter out direct cash/loan transactions
    const totalCashReceived = allCashReceived
      .filter((entry: any) => {
        // Exclude entries marked as direct cash (loans)
        return entry.isDirectCash !== true;
      })
      .reduce((sum: number, entry: any) => sum + entry.creditAmount, 0);

    // 4. Get total expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // 5. Get total discount given
    const discounts = await prisma.clearanceReceipt.findMany({
      where: {
        clearanceDate: {
          gte: startDate,
          lte: endDate,
        },
        discount: {
          gt: 0,
        },
      },
      select: {
        discount: true,
      },
    });

    const totalDiscount = discounts.reduce(
      (sum, receipt) => sum + receipt.discount,
      0
    );

    // 6. Calculate net profit
    // Profit = Cash Received - Expenses - Discount
    const netProfit = totalCashReceived - totalExpenses - totalDiscount;

    // 7. Get outstanding balance (all customers)
    const allLedgerEntries = await prisma.ledger.findMany({
      where: {
        createdAt: {
          lte: endDate,
        },
      },
      select: {
        customerId: true,
        debitAmount: true,
        creditAmount: true,
      },
    });

    // Calculate balance per customer
    const customerBalances = allLedgerEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.customerId]) {
          acc[entry.customerId] = 0;
        }
        acc[entry.customerId] += entry.debitAmount - entry.creditAmount;
        return acc;
      },
      {} as Record<number, number>
    );

    const totalOutstandingBalance = Object.values(customerBalances).reduce(
      (sum, balance) => sum + balance,
      0
    );

    // 8. Get direct cash transactions (loans)
    const allDirectCashTransactions = await (prisma as any).ledger.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDirectCash: true, // Get only entries marked as direct cash (loans)
      },
      select: {
        debitAmount: true,
        creditAmount: true,
        isDirectCash: true,
      },
    });

    const totalDirectCashGiven = allDirectCashTransactions.reduce(
      (sum: number, entry: any) => sum + entry.debitAmount,
      0
    );

    const totalDirectCashReceived = allDirectCashTransactions.reduce(
      (sum: number, entry: any) => sum + entry.creditAmount,
      0
    );

    const netDirectCash = totalDirectCashGiven - totalDirectCashReceived;

    // 9. Get expense breakdown by category
    const expensesByCategory = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const expenseCategoryBreakdown = expensesByCategory.reduce(
      (acc, expense) => {
        const categoryName = expense.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const reportData = {
      dateRange: {
        from: startDate,
        to: endDate,
      },
      summary: {
        totalEntryAmount,
        totalClearanceAmount,
        totalCashReceived,
        totalExpenses,
        totalDiscount,
        netProfit,
        totalOutstandingBalance,
        totalDirectCashGiven,
        totalDirectCashReceived,
        netDirectCash,
      },
      breakdown: {
        expensesByCategory: expenseCategoryBreakdown,
      },
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating profit audit report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate profit audit report' },
      { status: 500 }
    );
  }
}
