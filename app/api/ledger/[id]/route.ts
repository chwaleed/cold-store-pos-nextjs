import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DELETE /api/ledger/[id] - Delete a specific ledger entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ledgerId = parseInt(params.id);

    if (isNaN(ledgerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ledger ID' },
        { status: 400 }
      );
    }

    // First, check if the ledger entry exists and get its details
    const ledgerEntry = await prisma.ledger.findUnique({
      where: { id: ledgerId },
      include: {
        entryReceipt: true,
        clearanceReceipt: true,
      },
    });

    if (!ledgerEntry) {
      return NextResponse.json(
        { success: false, error: 'Ledger entry not found' },
        { status: 404 }
      );
    }

    // Check if this is a system-generated entry (linked to receipts)
    if (ledgerEntry.entryReceiptId || ledgerEntry.clearanceReceiptId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete system-generated ledger entries. Delete the associated receipt instead.' 
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete associated cash book entry if it exists
      await tx.cashBookEntry.deleteMany({
        where: {
          referenceId: ledgerId,
          referenceType: 'ledger_entry',
          source: 'ledger',
        },
      });

      // Delete the ledger entry
      await tx.ledger.delete({
        where: { id: ledgerId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Ledger entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ledger entry' },
      { status: 500 }
    );
  }
}