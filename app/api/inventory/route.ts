import { NextRequest, NextResponse } from 'next/server';
import { differenceInDays } from 'date-fns';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');
    const type = searchParams.get('type');
    const typeSub = searchParams.get('subType');
    const marka = searchParams.get('marka');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const showZeroStock = searchParams.get('showZeroStock') === 'true';
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (room && room !== 'all') {
      where.roomId = parseInt(room);
    }

    if (type && type !== 'all') {
      where.productTypeId = parseInt(type);
    }

    if (marka) {
      where.marka = { contains: marka };
    }

    // Handle search parameter (receipt no, marka)
    if (search && search.trim() !== '') {
      where.OR = [
        { marka: { contains: search.trim() } },
        {
          entryReceipt: {
            receiptNo: { contains: search.trim() },
          },
        },
      ];
    }

    // Handle customer filter
    if (customerId && customerId !== '' && customerId !== 'all') {
      if (!where.entryReceipt) {
        where.entryReceipt = {};
      }
      where.entryReceipt.customerId = parseInt(customerId);
    }

    if (dateFrom || dateTo) {
      if (!where.entryReceipt) {
        where.entryReceipt = {};
      }
      if (!where.entryReceipt.entryDate) {
        where.entryReceipt.entryDate = {};
      }
      if (dateFrom) where.entryReceipt.entryDate.gte = new Date(dateFrom);
      if (dateTo) where.entryReceipt.entryDate.lte = new Date(dateTo);
    }

    // --- NEW: Move showZeroStock filter into the 'where' clause ---
    if (!showZeroStock) {
      // This structure finds items that are NOT zero stock
      // We add it to an 'AND' array to combine with other filters
      where.AND = [
        ...(where.AND || []), // Preserve other AND conditions if any
        {
          OR: [
            // Case 1: Has KhaliJali, EITHER product OR kj has quantity > 0
            {
              hasKhaliJali: true,
              OR: [
                { remainingQuantity: { gt: 0 } },
                { remainingKjQuantity: { gt: 0 } },
              ],
            },
            // Case 2: Does NOT have KhaliJali, product has quantity > 0
            {
              hasKhaliJali: false,
              remainingQuantity: { gt: 0 },
            },
          ],
        },
      ];
    }

    // --- MODIFIED: Use $transaction to get count and paginated data ---
    const [totalItems, entryItems] = await prisma.$transaction([
      // 1. Get the total count of items matching the filters
      prisma.entryItem.count({ where }),
      // 2. Get the paginated data
      prisma.entryItem.findMany({
        where,
        include: {
          entryReceipt: {
            include: {
              customer: true,
            },
          },
          productType: true,
          productSubType: true,
          room: true,
        },
        orderBy: {
          entryReceipt: {
            entryDate: 'desc',
          },
        },
        // Apply pagination at the database level
        skip: skip,
        take: limit,
      }),
    ]);
    // --- End of modified block ---

    const today = new Date();

    // Calculate inventory with double rent logic
    // This 'inventory' array will now only contain the items for the current page
    const inventory = entryItems.map((item) => {
      const availableQty = item.remainingQuantity;
      const availableKjQty = item.remainingKjQuantity ?? 0;

      // --- REMOVED ---
      // The zero stock filter is no longer needed here,
      // as it was handled by the database query.
      // ---

      const daysInStorage = differenceInDays(
        today,
        item.entryReceipt.entryDate
      );

      // Double rent calculation

      const totalValue = availableQty * item.unitPrice;

      let grandTotal =
        availableQty * item.unitPrice +
        availableKjQty * (item.kjUnitPrice || 0);

      if (item.isDoubled) {
        grandTotal = grandTotal + availableQty * item.unitPrice;
      }

      return {
        id: item.id,
        entryDate: item.entryReceipt.entryDate,
        customerName: item.entryReceipt.customer.name,
        marka: item.marka,
        typeName: item.productType.name,
        subtypeName: item.productSubType?.name || null,
        roomName: item.room.name,
        boxNo: item.boxNo,
        availableQty,
        unitPrice: item.unitPrice,
        daysInStorage,
        isDoubled: item.isDoubled,
        kjQuantity: item.kjQuantity,
        kjUnitPrice: item.kjUnitPrice,
        kjTotal: item.kjTotal,
        grandTotal,
        hasKhaliJali: item.hasKhaliJali,
        remainingKjQuantity: item.remainingKjQuantity,
        reciptNo: item.entryReceipt?.receiptNo,
        hasDoubleRentEnabled: item.productType.doubleRentAfter30Days,
      };
    });

    const summary = {
      totalQuantity: inventory.reduce(
        (sum, item) => sum + (item.availableQty || 0),
        0
      ),
      totalValue: inventory.reduce(
        (sum, item) => sum + (item.grandTotal || 0),
        0
      ),
    };

    // --- MODIFIED: Pagination calculation ---
    const totalPages = Math.ceil(totalItems / limit);
    // --- REMOVED: startIndex, endIndex, and slice ---

    return NextResponse.json({
      success: true,
      data: inventory, // This is now the paginated list
      summary, // Be aware: This is a summary of the *page*, not *all* data.
      pagination: {
        currentPage: page,
        lastPage: totalPages,
        perPage: limit,
        total: totalItems, // This is the TRUE total count from the DB
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
