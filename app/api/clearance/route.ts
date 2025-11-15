import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearanceReceiptSchema } from '@/schema/clearance';

// GET - List all clearance receipts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by clearance number or car number
    if (search) {
      where.OR = [
        { clearanceNo: { contains: search } },
        { carNo: { contains: search } },
      ];
    }

    // Filter by customer
    if (customerId && customerId !== 'all') {
      where.customerId = parseInt(customerId);
    }

    // Filter by date range
    if (startDate || endDate) {
      where.clearanceDate = {};
      if (startDate) {
        where.clearanceDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.clearanceDate.lt = endDateTime;
      }
    }

    const [clearances, total] = await Promise.all([
      prisma.clearanceReceipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { clearanceDate: 'desc' },
        include: {
          customer: true,
          entryReceipt: true,
          clearedItems: {
            include: {
              entryItem: {
                include: {
                  productType: true,
                  productSubType: true,
                  packType: true,
                  room: true,
                },
              },
            },
          },
        },
      }),
      prisma.clearanceReceipt.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: clearances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching clearances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clearances' },
      { status: 500 }
    );
  }
}

// POST - Create new clearance receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse and validate data
    const validatedData = clearanceReceiptSchema.parse({
      ...body,
      clearanceDate: body.clearanceDate
        ? new Date(body.clearanceDate)
        : new Date(),
    });

    // Find entry receipt by receipt number
    const entryReceipt = await prisma.entryReceipt.findUnique({
      where: { receiptNo: validatedData.entryReceiptNo },
      include: {
        items: true,
      },
    });

    if (!entryReceipt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Entry receipt not found with the provided receipt number',
        },
        { status: 404 }
      );
    }

    // Verify customer matches
    if (entryReceipt.customerId !== validatedData.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Entry receipt does not belong to the selected customer',
        },
        { status: 400 }
      );
    }

    // Verify all items belong to the entry receipt and have sufficient quantity
    for (const item of validatedData.items) {
      const entryItem = entryReceipt.items.find(
        (ei) => ei.id === item.entryItemId
      );

      if (!entryItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Item ${item.entryItemId} not found in entry receipt`,
          },
          { status: 400 }
        );
      }

      if (entryItem.remainingQuantity < item.quantityCleared) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient quantity for item ${item.entryItemId}. Available: ${entryItem.remainingQuantity}, Requested: ${item.quantityCleared}`,
          },
          { status: 400 }
        );
      }

      // Verify KJ quantity if item has KJ and KJ quantity is being cleared
      if (entryItem.hasKhaliJali && item.kjQuantityCleared) {
        if (
          !entryItem.kjQuantity ||
          item.kjQuantityCleared > entryItem.kjQuantity
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient KJ quantity for item ${item.entryItemId}. Available: ${entryItem.kjQuantity || 0}, Requested: ${item.kjQuantityCleared}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate clearance number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const count = await prisma.clearanceReceipt.count({
      where: {
        clearanceDate: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });
    const clearanceNo = `CL-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Calculate days stored and total rent
    const clearanceDate = validatedData.clearanceDate || new Date();
    const daysStored = Math.max(
      1,
      Math.ceil(
        (clearanceDate.getTime() - entryReceipt.entryDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    let totalRent = 0;
    const clearedItemsData = validatedData.items.map((item) => {
      const entryItem = entryReceipt.items.find(
        (ei) => ei.id === item.entryItemId
      )!;

      // Use entry item's unitPrice as rent per day (this is the rent that was charged during entry)
      const rentPerDay = entryItem.unitPrice;
      const itemRent = item.quantityCleared * daysStored * rentPerDay;
      totalRent += itemRent;

      return {
        entryItemId: item.entryItemId,
        quantityCleared: item.quantityCleared,
        kjQuantityCleared: item.kjQuantityCleared || null,
        daysStored,
        rentPerDay,
        totalRent: itemRent,
      };
    });

    // Create clearance receipt with cleared items in a transaction
    const clearance = await prisma.$transaction(async (tx) => {
      // Create clearance receipt
      const receipt = await tx.clearanceReceipt.create({
        data: {
          clearanceNo,
          customerId: validatedData.customerId,
          entryReceiptId: entryReceipt.id,
          carNo: validatedData.carNo || null,
          clearanceDate,
          totalRent,
          description: validatedData.description || null,
          clearedItems: {
            create: clearedItemsData,
          },
        },
        include: {
          customer: true,
          entryReceipt: true,
          clearedItems: {
            include: {
              entryItem: {
                include: {
                  productType: true,
                  productSubType: true,
                  packType: true,
                  room: true,
                },
              },
            },
          },
        },
      });

      // Update remaining quantities in entry items
      for (const item of validatedData.items) {
        await tx.entryItem.update({
          where: { id: item.entryItemId },
          data: {
            remainingQuantity: {
              decrement: item.quantityCleared,
            },
          },
        });
      }

      // Create ledger entry for rent (DEBIT)
      await tx.ledger.create({
        data: {
          customerId: validatedData.customerId,
          invoiceId: receipt.id,
          description: `Rent for Clearance ${clearanceNo}`,
          debitAmount: totalRent,
          creditAmount: 0,
        },
      });

      return receipt;
    });

    return NextResponse.json(
      { success: true, data: clearance },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating clearance:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create clearance' },
      { status: 500 }
    );
  }
}
