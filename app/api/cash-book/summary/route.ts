import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { openingBalanceSchema } from '@/schema/cash-book';

// GET /api/cash-book/summary - Get daily cash summary for a specific date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Set to start of day for consistent date matching
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Get existing summary or create a new one with calculated values
    let summary = await prisma.dailyCashSummary.findUnique({
      where: { date: startOfDay },
    });

    if (!summary) {
      // Calculate opening balance from previous day's closing balance
      const previousDay = new Date(startOfDay);
      previousDay.setDate(previousDay.getDate() - 1);

      const previousSummary = await prisma.dailyCashSummary.findUnique({
        where: { date: previousDay },
      });

      const openingBalance = previousSummary?.closingBalance || 0;

      // Calculate current day's transactions
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const transactions = await prisma.cashBookEntry.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const totalInflows = transactions
        .filter((t) => t.transactionType === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalOutflows = transactions
        .filter((t) => t.transactionType === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);

      const closingBalance = openingBalance + totalInflows - totalOutflows;

      // Create new summary
      summary = await prisma.dailyCashSummary.create({
        data: {
          date: startOfDay,
          openingBalance,
          totalInflows,
          totalOutflows,
          closingBalance,
        },
      });
    }

    // Include audit trail information if requested
    const includeAudit =
      request.nextUrl.searchParams.get('includeAudit') === 'true';

    if (includeAudit && summary) {
      const summaryWithAudit = await prisma.dailyCashSummary.findUnique({
        where: { id: summary.id },
        include: {
          auditTrail: {
            orderBy: {
              changeTimestamp: 'desc',
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: summaryWithAudit,
      });
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching daily cash summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily cash summary' },
      { status: 500 }
    );
  }
}

// POST /api/cash-book/summary - Set opening balance for a date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = openingBalanceSchema.parse(body);

    // Additional validation for opening balance modifications
    if (validatedData.openingBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Opening balance cannot be negative' },
        { status: 400 }
      );
    }

    // Validate date is not too far in the future (more than 7 days)
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7);

    if (validatedData.date > maxFutureDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot set opening balance more than 7 days in the future',
        },
        { status: 400 }
      );
    }

    // Set to start of day for consistent date matching
    const startOfDay = new Date(validatedData.date);
    startOfDay.setHours(0, 0, 0, 0);

    // Get existing summary to check for changes
    const existingSummary = await prisma.dailyCashSummary.findUnique({
      where: { date: startOfDay },
    });

    const oldOpeningBalance = existingSummary?.openingBalance || 0;
    const newOpeningBalance = validatedData.openingBalance;

    // Calculate current day's transactions to update totals
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.cashBookEntry.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const totalInflows = transactions
      .filter((t) => t.transactionType === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflows = transactions
      .filter((t) => t.transactionType === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const closingBalance = newOpeningBalance + totalInflows - totalOutflows;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the daily summary with new opening balance
      const summary = await tx.dailyCashSummary.upsert({
        where: { date: startOfDay },
        update: {
          openingBalance: newOpeningBalance,
          totalInflows,
          totalOutflows,
          closingBalance,
          updatedAt: new Date(),
        },
        create: {
          date: startOfDay,
          openingBalance: newOpeningBalance,
          totalInflows,
          totalOutflows,
          closingBalance,
        },
      });

      // Create audit trail record if opening balance changed
      if (oldOpeningBalance !== newOpeningBalance) {
        await tx.openingBalanceAudit.create({
          data: {
            dailyCashSummaryId: summary.id,
            oldOpeningBalance,
            newOpeningBalance,
            changeReason: body.changeReason || 'Opening balance adjustment',
            changedBy: body.changedBy || 'System',
            changeTimestamp: new Date(),
          },
        });
      }

      return summary;
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Opening balance set successfully',
        auditCreated: oldOpeningBalance !== newOpeningBalance,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error setting opening balance:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to set opening balance' },
      { status: 500 }
    );
  }
}
