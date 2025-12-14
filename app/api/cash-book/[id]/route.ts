import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cashBookEntryUpdateSchema } from '@/schema/cash-book';

// GET /api/cash-book/[id] - Get specific cash book entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = parseInt(params.id);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const entry = await prisma.CashBookEntry.findUnique({
      where: { id: entryId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Cash book entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Error fetching cash book entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cash book entry' },
      { status: 500 }
    );
  }
}

// PUT /api/cash-book/[id] - Update cash book entry (manual entries only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = parseInt(params.id);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = cashBookEntryUpdateSchema.parse(body);

    // Check if entry exists and is manual
    const existingEntry = await prisma.CashBookEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Cash book entry not found' },
        { status: 404 }
      );
    }

    // Only allow updates to manual entries
    if (existingEntry.source !== 'manual') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only manual cash book entries can be updated',
        },
        { status: 403 }
      );
    }

    // Validate customer exists if customerId is provided
    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
    }

    // Update the entry
    const updatedEntry = await prisma.cashBookEntry.update({
      where: { id: entryId },
      data: validatedData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Update daily cash summary for the entry's date
    await updateDailyCashSummary(existingEntry.date);

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Cash book entry updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating cash book entry:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update cash book entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/cash-book/[id] - Delete cash book entry (manual entries only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = parseInt(params.id);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    // Check if entry exists and is manual
    const existingEntry = await prisma.cashBookEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Cash book entry not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of manual entries
    if (existingEntry.source !== 'manual') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only manual cash book entries can be deleted',
        },
        { status: 403 }
      );
    }

    // Delete the entry
    await prisma.cashBookEntry.delete({
      where: { id: entryId },
    });

    // Update daily cash summary for the entry's date
    await updateDailyCashSummary(existingEntry.date);

    return NextResponse.json({
      success: true,
      message: 'Cash book entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting cash book entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cash book entry' },
      { status: 500 }
    );
  }
}

// Helper function to update daily cash summary
async function updateDailyCashSummary(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Calculate totals for the day
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

  // Get or create daily summary
  const existingSummary = await prisma.dailyCashSummary.findUnique({
    where: { date: startOfDay },
  });

  const openingBalance = existingSummary?.openingBalance || 0;
  const closingBalance = openingBalance + totalInflows - totalOutflows;

  await prisma.dailyCashSummary.upsert({
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
