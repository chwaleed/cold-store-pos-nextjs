import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateCashBookEntryForSource } from '@/lib/cash-book-integration';

// GET - Get clearance receipt by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid clearance ID' },
        { status: 400 }
      );
    }

    const clearance = await prisma.clearanceReceipt.findUnique({
      where: { id },
      include: {
        customer: true,
        clearedItems: {
          include: {
            entryItem: {
              include: {
                productType: true,
                productSubType: true,
                packType: true,
                room: true,
                entryReceipt: {
                  select: {
                    receiptNo: true,
                    carNo: true,
                    entryDate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!clearance) {
      return NextResponse.json(
        { success: false, error: 'Clearance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: clearance,
    });
  } catch (error) {
    console.error('Error fetching clearance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clearance' },
      { status: 500 }
    );
  }
}

// DELETE - Delete clearance receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid clearance ID' },
        { status: 400 }
      );
    }

    // Check if clearance exists
    const clearance = await prisma.clearanceReceipt.findUnique({
      where: { id },
      include: {
        clearedItems: true,
      },
    });

    if (!clearance) {
      return NextResponse.json(
        { success: false, error: 'Clearance not found' },
        { status: 404 }
      );
    }

    // Delete clearance and update cash book in transaction
    await prisma.$transaction(async (tx) => {
      // Restore quantities in entry items
      for (const clearedItem of clearance.clearedItems) {
        await tx.entryItem.update({
          where: { id: clearedItem.entryItemId },
          data: {
            remainingQuantity: {
              increment: clearedItem.clearQuantity,
            },
            remainingKjQuantity: clearedItem.clearKjQuantity
              ? {
                  increment: clearedItem.clearKjQuantity,
                }
              : undefined,
          },
        });
      }

      // Delete related ledger entries
      await tx.ledger.deleteMany({
        where: { clearanceReceiptId: id },
      });

      // Delete clearance receipt (cascade will delete cleared items)
      await tx.clearanceReceipt.delete({
        where: { id },
      });

      // Remove cash book entries for this clearance
      await updateCashBookEntryForSource(
        id,
        'clearance_receipt',
        undefined,
        tx
      );
    });

    // Update daily cash summary after transaction completes
    await updateDailyCashSummaryHelper(clearance.clearanceDate);

    return NextResponse.json({
      success: true,
      message: 'Clearance deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting clearance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete clearance' },
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
