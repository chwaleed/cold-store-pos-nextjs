import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { entryReceiptSchema } from '@/schema/entry';

// GET /api/entry - List entry receipts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by receipt number or car number
    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { carNo: { contains: search } },
      ];
    }

    // Filter by customer
    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    // Filter by date range
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.entryDate.lt = endDateTime;
      }
    }

    const [entries, total] = await Promise.all([
      prisma.entryReceipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.entryReceipt.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching entry receipts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entry receipts' },
      { status: 500 }
    );
  }
}

// POST /api/entry - Create new entry receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = entryReceiptSchema.parse(body);

    // Calculate totals for each item
    const items = validatedData.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      const kjTotal =
        item.hasKhaliJali && item.kjQuantity && item.kjUnitPrice
          ? item.kjQuantity * item.kjUnitPrice
          : 0;
      const grandTotal = totalPrice + kjTotal;

      return {
        productTypeId: item.productTypeId,
        productSubTypeId: item.productSubTypeId || null,
        packTypeId: item.packTypeId,
        roomId: item.roomId,
        boxNo: item.boxNo || null,
        marka: item.marka || null,
        quantity: item.quantity,
        remainingQuantity: item.quantity, // Initially, remaining = quantity
        unitPrice: item.unitPrice,
        totalPrice,
        hasKhaliJali: item.hasKhaliJali,
        kjQuantity: item.kjQuantity || null,
        remainingKjQuantity: item.kjQuantity || null, // Initially, remaining KJ = kjQuantity
        kjUnitPrice: item.kjUnitPrice || null,
        kjTotal: kjTotal > 0 ? kjTotal : null,
        grandTotal,
      };
    });

    // Calculate total amount for receipt
    const totalAmount = items.reduce((sum, item) => sum + item.grandTotal, 0);

    // Create entry receipt with items in a transaction
    const entryReceipt = await prisma.$transaction(async (tx) => {
      // Create the entry receipt
      const receipt = await tx.entryReceipt.create({
        data: {
          receiptNo: validatedData.receiptNo,
          customerId: validatedData.customerId,
          carNo: validatedData.carNo,
          entryDate: validatedData.entryDate
            ? new Date(validatedData.entryDate)
            : new Date(),
          totalAmount,
          description: validatedData.description || null,
          items: {
            create: items,
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

      // Create ledger entry for inventory addition (debit)
      await tx.ledger.create({
        data: {
          customerId: validatedData.customerId,
          type: 'adding_inventory',
          entryReceiptId: receipt.id,
          description: `Entry Receipt: ${validatedData.receiptNo}`,
          debitAmount: totalAmount,
          creditAmount: 0,
          isDiscount: false,
        },
      });

      return receipt;
    });

    return NextResponse.json(
      {
        success: true,
        data: entryReceipt,
        message: 'Entry receipt created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating entry receipt:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create entry receipt' },
      { status: 500 }
    );
  }
}
