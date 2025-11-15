import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Fetch entry receipt by receipt number
export async function GET(
  request: NextRequest,
  { params }: { params: { receiptNo: string } }
) {
  try {
    const { receiptNo } = params;

    const entryReceipt = await prisma.entryReceipt.findUnique({
      where: { receiptNo },
      include: {
        customer: true,
        items: {
          where: {
            remainingQuantity: {
              gt: 0,
            },
          },
          include: {
            productType: true,
            productSubType: true,
            packType: true,
            room: true,
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
