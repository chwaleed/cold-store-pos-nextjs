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
    const productSubTypeId = searchParams.get('productSubTypeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Build where clause - show items with ANY remaining quantity
    // Items are clearable if they have remainingQuantity > 0 OR remainingKjQuantity > 0 (for KJ items)
    const where: any = {
      OR: [
        // Items with remaining product quantity
        {
          remainingQuantity: { gt: 0 },
        },
        // Items with KJ and remaining KJ quantity (even if product quantity is 0)
        {
          hasKhaliJali: true,
          remainingKjQuantity: { gt: 0 },
        },
      ],
    };

    // Filter by customer through entry receipt
    if (customerId) {
      where.entryReceipt = {
        customerId: parseInt(customerId),
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

    // Filter by product subtype
    if (productSubTypeId) {
      where.productSubTypeId = parseInt(productSubTypeId);
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.entryReceipt = {
        ...where.entryReceipt,
        entryDate: {},
      };

      if (dateFrom) {
        where.entryReceipt.entryDate.gte = new Date(dateFrom);
      }

      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.entryReceipt.entryDate.lte = endDate;
      }
    }

    // Combined search for receipt number, marka, and box number
    // Supports searching by any of these fields in a single search input
    if (search) {
      where.OR = [
        { marka: { contains: search } },
        {
          entryReceipt: {
            receiptNo: { contains: search },
          },
        },
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
