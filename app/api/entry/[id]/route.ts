import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/entry/[id] - Get entry receipt details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry receipt ID' },
        { status: 400 }
      );
    }

    const entryReceipt = await prisma.entryReceipt.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            productType: true,
            productSubType: true,
            packType: true,
            room: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!entryReceipt) {
      return NextResponse.json(
        { success: false, error: 'Entry receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entryReceipt,
    });
  } catch (error) {
    console.error('Error fetching entry receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entry receipt' },
      { status: 500 }
    );
  }
}

// PUT /api/entry/[id] - Update entry receipt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry receipt ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { customerId, carNo, description, items } = body;

    // Validate required fields
    if (!customerId || !carNo || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if entry receipt exists and get old total amount
    const existingReceipt = await prisma.entryReceipt.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingReceipt) {
      return NextResponse.json(
        { success: false, error: 'Entry receipt not found' },
        { status: 404 }
      );
    }

    const oldTotalAmount = existingReceipt.totalAmount;

    // Build a map of existing items by their id to preserve clearance data
    const existingItemsMap = new Map(
      existingReceipt.items.map((item) => [item.id, item])
    );

    // Calculate new total amount
    let newTotalAmount = 0;
    const processedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      const kjTotal = item.hasKhaliJali
        ? (item.kjQuantity || 0) * (item.kjUnitPrice || 0)
        : 0;
      const grandTotal = totalPrice + kjTotal;
      newTotalAmount += grandTotal;
      console.log('procssed item = ');

      // Get the existing item to preserve remaining quantities
      const existingItem = item.id ? existingItemsMap.get(item.id) : null;

      return {
        id: item.id || undefined, // Preserve id if editing existing item
        productTypeId: item.productTypeId,
        productSubTypeId: item.productSubTypeId || null,
        packTypeId: item.packTypeId,
        roomId: item.roomId,
        boxNo: item.boxNo || null,
        marka: item.marka || null,
        quantity: item.quantity,
        remainingQuantity: existingItem
          ? Math.min(item.quantity, existingItem.remainingQuantity)
          : item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        hasKhaliJali: item.hasKhaliJali || false,
        kjQuantity: item.kjQuantity || null,
        // Preserve remaining KJ quantity if item was partially cleared
        remainingKjQuantity:
          existingItem && item.kjQuantity
            ? Math.min(item.kjQuantity, existingItem.remainingKjQuantity || 0)
            : item.kjQuantity || null,
        kjUnitPrice: item.kjUnitPrice || null,
        kjTotal: kjTotal > 0 ? kjTotal : null,
        grandTotal,
      };
    });
    console.log('processed items = ', processedItems);

    // Update entry receipt, items, and ledger in transaction
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // Update existing items or create new ones
      for (const processedItem of processedItems) {
        if (processedItem.id) {
          // Update existing item
          await tx.entryItem.update({
            where: { id: processedItem.id },
            data: {
              quantity: processedItem.quantity,
              remainingQuantity: processedItem.remainingQuantity,
              unitPrice: processedItem.unitPrice,
              totalPrice: processedItem.totalPrice,
              hasKhaliJali: processedItem.hasKhaliJali,
              kjQuantity: processedItem.kjQuantity,
              remainingKjQuantity: processedItem.remainingKjQuantity,
              kjUnitPrice: processedItem.kjUnitPrice,
              kjTotal: processedItem.kjTotal,
              grandTotal: processedItem.grandTotal,
              boxNo: processedItem.boxNo,
              marka: processedItem.marka,
              packTypeId: processedItem.packTypeId,
              roomId: processedItem.roomId,
            },
          });
        }
      }

      // Update entry receipt with new total
      const receipt = await tx.entryReceipt.update({
        where: { id },
        data: {
          customerId,
          carNo,
          description: description || null,
          totalAmount: newTotalAmount,
        },
        include: {
          customer: true,
          items: {
            include: {
              productType: true,
              productSubType: true,
              packType: true,
              room: true,
            },
          },
        },
      });

      // Update the ledger entry if amount changed
      if (oldTotalAmount !== newTotalAmount) {
        // Find the ledger entry for this receipt
        const ledgerEntry = await tx.ledger.findFirst({
          where: {
            entryReceiptId: id,
            type: 'adding_inventory',
          },
        });

        if (ledgerEntry) {
          // Update the ledger entry with new debit amount
          await tx.ledger.update({
            where: { id: ledgerEntry.id },
            data: {
              debitAmount: newTotalAmount,
              description: `Entry Receipt: ${existingReceipt.receiptNo} (Updated)`,
            },
          });
        }
      }

      return receipt;
    });

    return NextResponse.json({
      success: true,
      data: updatedReceipt,
      message: 'Entry receipt and ledger updated successfully',
    });
  } catch (error) {
    console.error('Error updating entry receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update entry receipt' },
      { status: 500 }
    );
  }
}

// DELETE /api/entry/[id] - Delete entry receipt (only if no clearances)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry receipt ID' },
        { status: 400 }
      );
    }

    // Check if entry receipt exists
    const entryReceipt = await prisma.entryReceipt.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clearanceReceipts: true,
          },
        },
      },
    });

    if (!entryReceipt) {
      return NextResponse.json(
        { success: false, error: 'Entry receipt not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are clearances
    if (entryReceipt._count.clearanceReceipts > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete entry receipt with existing clearances',
        },
        { status: 400 }
      );
    }

    // Delete entry receipt (items will be deleted due to cascade)
    await prisma.entryReceipt.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Entry receipt deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entry receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete entry receipt' },
      { status: 500 }
    );
  }
}
