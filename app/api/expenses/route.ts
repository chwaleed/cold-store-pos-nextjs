import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createCashBookEntry } from '@/lib/cash-book-integration';

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, categoryId, amount, description } = body;

    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          date: new Date(date),
          categoryId,
          amount,
          description,
        },
        include: {
          category: true,
        },
      });

      // Create cash book entry for expense
      await createCashBookEntry(
        {
          date: new Date(date),
          transactionType: 'outflow',
          amount,
          description: `Expense: ${description}`,
          source: 'expense',
          referenceId: newExpense.id,
          referenceType: 'expense',
        },
        tx
      );

      return newExpense;
    });

    // Update daily cash summary after transaction completes
    await updateDailyCashSummaryHelper(new Date(date));

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
// Helper function to update daily cash summary
async function updateDailyCashSummaryHelper(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Calculate totals for the day
  const transactions = await (prisma as any).cashBookEntry.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const totalInflows = transactions
    .filter((t: any) => t.transactionType === 'inflow')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalOutflows = transactions
    .filter((t: any) => t.transactionType === 'outflow')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Get or create daily summary
  const existingSummary = await (prisma as any).dailyCashSummary.findUnique({
    where: { date: startOfDay },
  });

  let openingBalance = existingSummary?.openingBalance || 0;

  // If no existing summary, try to get opening balance from previous day's closing balance
  if (!existingSummary) {
    const previousDay = new Date(startOfDay);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousSummary = await (prisma as any).dailyCashSummary.findUnique({
      where: { date: previousDay },
    });

    openingBalance = previousSummary?.closingBalance || 0;
  }

  const closingBalance = openingBalance + totalInflows - totalOutflows;

  await (prisma as any).dailyCashSummary.upsert({
    where: { date: startOfDay },
    update: {
      totalInflows,
      totalOutflows,
      closingBalance,
    },
    create: {
      date: startOfDay,
      openingBalance,
      totalInflows,
      totalOutflows,
      closingBalance,
    },
  });
}
