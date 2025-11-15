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

    // Check if entry receipt exists
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

    // Calculate total amount
    let totalAmount = 0;
    const processedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      const kjTotal = item.hasKhaliJali
        ? (item.kjQuantity || 0) * (item.kjUnitPrice || 0)
        : 0;
      const grandTotal = totalPrice + kjTotal;
      totalAmount += grandTotal;

      return {
        productTypeId: item.productTypeId,
        productSubTypeId: item.productSubTypeId || null,
        packTypeId: item.packTypeId,
        roomId: item.roomId,
        boxNo: item.boxNo || null,
        marka: item.marka || null,
        quantity: item.quantity,
        remainingQuantity: item.quantity, // Keep as initial quantity
        unitPrice: item.unitPrice,
        totalPrice,
        hasKhaliJali: item.hasKhaliJali || false,
        kjQuantity: item.kjQuantity || null,
        kjUnitPrice: item.kjUnitPrice || null,
        kjTotal: kjTotal > 0 ? kjTotal : null,
        grandTotal,
      };
    });

    // Update entry receipt and items in transaction
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.entryItem.deleteMany({
        where: { entryReceiptId: id },
      });

      // Update entry receipt and create new items
      return await tx.entryReceipt.update({
        where: { id },
        data: {
          customerId,
          carNo,
          description: description || null,
          totalAmount,
          items: {
            create: processedItems,
          },
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
    });

    return NextResponse.json({
      success: true,
      data: updatedReceipt,
      message: 'Entry receipt updated successfully',
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
