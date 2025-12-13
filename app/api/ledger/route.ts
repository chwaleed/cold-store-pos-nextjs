import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const directCashSchema = z.object({
  customerId: z.number(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().min(1),
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.ledger.count({
        where: {
          customerId: parseInt(customerId),
        },
      }),
    ]);

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
      balance += entry.debitAmount - entry.creditAmount;
      balanceMap.set(entry.id, balance);
    });

    const entriesWithBalance = ledgerEntries.map((entry) => ({
      ...entry,
      balance: balanceMap.get(entry.id) || 0,
    }));

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

    const ledgerEntry = await prisma.ledger.create({
      data: {
        customerId: validatedData.customerId,
        type: 'direct_cash',
        description: validatedData.description,
        debitAmount: validatedData.type === 'debit' ? validatedData.amount : 0,
        creditAmount:
          validatedData.type === 'credit' ? validatedData.amount : 0,
        createdAt: new Date(validatedData.date),
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

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create ledger entry' },
      { status: 500 }
    );
  }
}
