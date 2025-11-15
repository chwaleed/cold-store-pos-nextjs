import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
