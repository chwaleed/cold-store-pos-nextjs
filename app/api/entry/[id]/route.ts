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
    const { customerId, carNo, description, items, receiptNo } = body;

    // Validate required fields
    if (!customerId || !carNo || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if entry receipt exists and get old data
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

    const oldCustomerId = existingReceipt.customerId;
    const oldTotalAmount = existingReceipt.totalAmount;
    const customerChanged = oldCustomerId !== customerId;

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

    // Update entry receipt, items, and ledger in transaction
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // Update existing items with new product types, subtypes, and recalculated prices
      for (const processedItem of processedItems) {
        if (processedItem.id) {
          // Update existing item with all fields including product type/subtype
          await tx.entryItem.update({
            where: { id: processedItem.id },
            data: {
              productTypeId: processedItem.productTypeId,
              productSubTypeId: processedItem.productSubTypeId,
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

      // Update entry receipt with new data
      const receipt = await tx.entryReceipt.update({
        where: { id },
        data: {
          customerId,
          carNo,
          receiptNo: receiptNo || existingReceipt.receiptNo,
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

      // Handle ledger updates
      if (customerChanged) {
        // Customer changed - remove old ledger entry and create new one

        // Delete old ledger entry from previous customer
        await tx.ledger.deleteMany({
          where: {
            entryReceiptId: id,
            type: 'adding_inventory',
            customerId: oldCustomerId,
          },
        });

        // Create new ledger entry for new customer
        await tx.ledger.create({
          data: {
            customerId: customerId,
            type: 'adding_inventory',
            entryReceiptId: id,
            description: `Entry Receipt: ${receiptNo || existingReceipt.receiptNo} (Customer Updated)`,
            debitAmount: newTotalAmount,
            creditAmount: 0,
          },
        });
      } else if (oldTotalAmount !== newTotalAmount) {
        // Same customer but amount changed - update existing ledger entry
        const ledgerEntry = await tx.ledger.findFirst({
          where: {
            entryReceiptId: id,
            type: 'adding_inventory',
          },
        });

        if (ledgerEntry) {
          await tx.ledger.update({
            where: { id: ledgerEntry.id },
            data: {
              debitAmount: newTotalAmount,
              description: `Entry Receipt: ${receiptNo || existingReceipt.receiptNo} (Updated)`,
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

// DELETE /api/entry/[id] - Delete entry receipt and all related records
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
        items: {
          include: {
            clearedItems: {
              include: {
                clearanceReceipt: true,
              },
            },
          },
        },
        ledgerEntries: true,
      },
    });

    if (!entryReceipt) {
      return NextResponse.json(
        { success: false, error: 'Entry receipt not found' },
        { status: 404 }
      );
    }

    // Perform cascade deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Get all clearance receipts that will be affected
      const affectedClearanceIds = new Set<number>();
      
      for (const item of entryReceipt.items) {
        for (const clearedItem of item.clearedItems) {
          affectedClearanceIds.add(clearedItem.clearanceReceiptId);
        }
      }

      // Step 2: Delete all cleared items related to this entry receipt
      await tx.clearedItem.deleteMany({
        where: {
          entryItemId: {
            in: entryReceipt.items.map(item => item.id),
          },
        },
      });

      // Step 3: Check and delete empty clearance receipts
      const clearanceIdsArray = Array.from(affectedClearanceIds);
      for (const clearanceId of clearanceIdsArray) {
        const remainingItems = await tx.clearedItem.count({
          where: { clearanceReceiptId: clearanceId },
        });

        if (remainingItems === 0) {
          // Delete related cash book entries for this clearance
          await tx.cashBookEntry.deleteMany({
            where: {
              referenceType: 'clearance_receipt',
              referenceId: clearanceId,
            },
          });

          // Delete the empty clearance receipt (ledger entries will cascade)
          await tx.clearanceReceipt.delete({
            where: { id: clearanceId },
          });
        } else {
          // Update clearance receipt total amount if it still has items
          const remainingClearedItems = await tx.clearedItem.findMany({
            where: { clearanceReceiptId: clearanceId },
          });
          
          const newTotal = remainingClearedItems.reduce(
            (sum, item) => sum + item.totalAmount, 
            0
          );

          await tx.clearanceReceipt.update({
            where: { id: clearanceId },
            data: { totalAmount: newTotal },
          });

          // Update related ledger entries
          await tx.ledger.updateMany({
            where: {
              clearanceReceiptId: clearanceId,
              type: 'clearance',
            },
            data: { creditAmount: newTotal },
          });
        }
      }

      // Step 4: Delete cash book entries related to this entry receipt
      await tx.cashBookEntry.deleteMany({
        where: {
          OR: [
            {
              referenceType: 'entry_receipt',
              referenceId: id,
            },
            {
              referenceType: 'ledger_entry',
              referenceId: {
                in: entryReceipt.ledgerEntries.map(ledger => ledger.id),
              },
            },
          ],
        },
      });

      // Step 5: Delete the entry receipt (this will cascade delete items and ledger entries)
      await tx.entryReceipt.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Entry receipt and all related records deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entry receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete entry receipt' },
      { status: 500 }
    );
  }
}
