import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { createCashBookEntry } from '@/lib/cash-book-integration';

const directCashSchema = z.object({
  customerId: z.number(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().min(1),
  isDirectCash: z.boolean().default(false),
});

// GET /api/ledger?customerId=123 - Get customer ledger entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Calculate running balance (need to get all entries for accurate balance calculation)
    const allEntries = await prisma.ledger.findMany({
      where: {
        customerId: parseInt(customerId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let balance = 0;
    const balanceMap = new Map<number, number>();
    allEntries.forEach((entry) => {
      // Include all entries (including discounts) in balance calculation
      balance += entry.debitAmount - entry.creditAmount;
      balanceMap.set(entry.id, balance);
    });

    const [ledgerEntries, total] = await Promise.all([
      prisma.ledger.findMany({
        where: {
          customerId: parseInt(customerId),
        },
        include: {
          entryReceipt: {
            select: {
              id: true,
              receiptNo: true,
              entryDate: true,
            },
          },
          clearanceReceipt: {
            select: {
              id: true,
              clearanceNo: true,
              clearanceDate: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.ledger.count({
        where: {
          customerId: parseInt(customerId),
        },
      }),
    ]);

    console.log(ledgerEntries);
    const entriesWithBalance = ledgerEntries.map((entry) => ({
      ...entry,
      balance: balanceMap.get(entry.id) || 0,
    }));
    console.log(balanceMap);

    return NextResponse.json({
      success: true,
      data: entriesWithBalance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger entries' },
      { status: 500 }
    );
  }
}

// POST /api/ledger - Add direct cash entry (debit or credit)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = directCashSchema.parse(body);

    const ledgerEntry = await prisma.$transaction(async (tx) => {
      const entry = await (tx as any).ledger.create({
        data: {
          customerId: validatedData.customerId,
          type: 'direct_cash',
          description: validatedData.description,
          debitAmount:
            validatedData.type === 'debit' ? validatedData.amount : 0,
          creditAmount:
            validatedData.type === 'credit' ? validatedData.amount : 0,
          isDirectCash: validatedData.isDirectCash,
          // Use current timestamp for proper sorting, but keep the date for cash book
          createdAt: new Date(),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create cash book entry for all direct cash transactions
      // Mark with isDirectCash flag so they can be excluded from profit/loss but still tracked
      await createCashBookEntry(
        {
          date: new Date(validatedData.date),
          transactionType:
            validatedData.type === 'debit' ? 'outflow' : 'inflow',
          amount: validatedData.amount,
          description: `Direct Cash: ${validatedData.description}`,
          source: 'ledger',
          referenceId: entry.id,
          referenceType: 'ledger_entry',
          customerId: validatedData.customerId,
          isDirectCash: validatedData.isDirectCash,
        },
        tx
      );

      return entry;
    });

    // Update daily cash summary after transaction completes
    await updateDailyCashSummaryHelper(new Date(validatedData.date));

    return NextResponse.json(
      {
        success: true,
        data: ledgerEntry,
        message: 'Ledger entry created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating ledger entry:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create ledger entry',
        details: error.message,
      },
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
