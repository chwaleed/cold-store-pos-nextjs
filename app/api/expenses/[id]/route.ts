import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateCashBookEntryForSource } from '@/lib/cash-book-integration';

// GET expense by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        category: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

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

// PUT update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { date, categoryId, amount, description } = body;
    const expenseId = parseInt(params.id);

    const expense = await prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
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

      // Update corresponding cash book entry
      await updateCashBookEntryForSource(
        expenseId,
        'expense',
        {
          date: new Date(date),
          transactionType: 'outflow',
          amount,
          description: `Expense: ${description}`,
          source: 'expense',
        },
        tx
      );

      return updatedExpense;
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

// DELETE expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = parseInt(params.id);

    // Get expense data before deletion
    const expenseToDelete = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { date: true },
    });

    if (!expenseToDelete) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({
        where: { id: expenseId },
      });

      // Remove corresponding cash book entry
      await updateCashBookEntryForSource(expenseId, 'expense', undefined, tx);
    });

    // Update daily cash summary after transaction completes
    await updateDailyCashSummaryHelper(expenseToDelete.date);

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
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
