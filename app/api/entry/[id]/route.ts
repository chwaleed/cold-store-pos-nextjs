import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/entry/[id] - Get entry receipt details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

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

// DELETE /api/entry/[id] - Delete entry receipt (only if no clearances)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

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
