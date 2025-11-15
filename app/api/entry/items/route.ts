import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Search and filter entry items available for clearance
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');
    const entryReceiptNo = searchParams.get('entryReceiptNo');
    const roomId = searchParams.get('roomId');
    const productTypeId = searchParams.get('productTypeId');

    const skip = (page - 1) * limit;

    // Build where clause - only show items with remaining quantity
    const where: any = {
      remainingQuantity: { gt: 0 },
    };

    // Filter by customer through entry receipt
    if (customerId) {
      where.entryReceipt = {
        customerId: parseInt(customerId),
      };
    }

    // Filter by entry receipt number
    if (entryReceiptNo) {
      where.entryReceipt = {
        ...where.entryReceipt,
        receiptNo: { contains: entryReceiptNo },
      };
    }

    // Filter by room
    if (roomId) {
      where.roomId = parseInt(roomId);
    }

    // Filter by product type
    if (productTypeId) {
      where.productTypeId = parseInt(productTypeId);
    }

    // Search by box number or marka
    if (search) {
      where.OR = [
        { boxNo: { contains: search } },
        { marka: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.entryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          productType: true,
          productSubType: true,
          packType: true,
          room: true,
          entryReceipt: {
            include: {
              customer: true,
            },
          },
        },
      }),
      prisma.entryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('Error fetching entry items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entry items' },
      { status: 500 }
    );
  }
}
