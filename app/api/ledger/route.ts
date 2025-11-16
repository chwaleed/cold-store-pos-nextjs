import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const directCashSchema = z.object({
  customerId: z.number(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive(),
  description: z.string().min(1),
});

// GET /api/ledger?customerId=123 - Get customer ledger entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const ledgerEntries = await prisma.ledger.findMany({
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
    });

    // Calculate running balance
    let balance = 0;
    const entriesWithBalance = ledgerEntries
      .reverse()
      .map((entry) => {
        balance += entry.debitAmount - entry.creditAmount;
        return {
          ...entry,
          balance,
        };
      })
      .reverse();

    return NextResponse.json({
      success: true,
      data: entriesWithBalance,
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
