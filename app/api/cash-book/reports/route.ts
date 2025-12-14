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

    // Fetch all cash book entries in the date range
    const cashBookEntries = await prisma.cashBookEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Fetch daily summaries for the date range
    const dailySummaries = await prisma.dailyCashSummary.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate overall totals
    const totalInflows = cashBookEntries
      .filter((entry) => entry.transactionType === 'inflow')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalOutflows = cashBookEntries
      .filter((entry) => entry.transactionType === 'outflow')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const netCashFlow = totalInflows - totalOutflows;

    // Group transactions by source
    const transactionsBySource = cashBookEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.source]) {
          acc[entry.source] = {
            inflows: 0,
            outflows: 0,
            count: 0,
          };
        }

        if (entry.transactionType === 'inflow') {
          acc[entry.source].inflows += entry.amount;
        } else {
          acc[entry.source].outflows += entry.amount;
        }
        acc[entry.source].count += 1;

        return acc;
      },
      {} as Record<string, { inflows: number; outflows: number; count: number }>
    );

    // Group transactions by date for daily breakdown
    const transactionsByDate = cashBookEntries.reduce(
      (acc, entry) => {
        const dateKey = entry.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: entry.date,
            inflows: 0,
            outflows: 0,
            transactions: [],
          };
        }

        if (entry.transactionType === 'inflow') {
          acc[dateKey].inflows += entry.amount;
        } else {
          acc[dateKey].outflows += entry.amount;
        }
        acc[dateKey].transactions.push(entry);

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate opening and closing balances
    let openingBalance = 0;
    if (dailySummaries.length > 0) {
      openingBalance = dailySummaries[0].openingBalance;
    }

    let closingBalance = openingBalance;
    if (dailySummaries.length > 0) {
      const lastSummary = dailySummaries[dailySummaries.length - 1];
      closingBalance = lastSummary.closingBalance;
    }

    const reportData = {
      dateRange: {
        from: startDate,
        to: endDate,
      },
      summary: {
        totalInflows,
        totalOutflows,
        netCashFlow,
        openingBalance,
        closingBalance,
        transactionCount: cashBookEntries.length,
      },
      transactionsBySource,
      transactionsByDate: Object.values(transactionsByDate),
      dailySummaries,
      transactions: cashBookEntries,
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating cash book report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cash book report' },
      { status: 500 }
    );
  }
}
