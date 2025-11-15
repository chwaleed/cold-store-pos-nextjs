import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearanceReceiptSchema } from '@/schema/clearance';

// GET - List all clearance receipts
// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '10');
//     const search = searchParams.get('search') || '';
//     const customerId = searchParams.get('customerId');
//     const startDate = searchParams.get('startDate');
//     const endDate = searchParams.get('endDate');

//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {};

//     // Search by clearance number or car number
//     if (search) {
//       where.OR = [
//         { clearanceNo: { contains: search } },
//         { carNo: { contains: search } },
//       ];
//     }

//     // Filter by customer
//     if (customerId && customerId !== 'all') {
//       where.customerId = parseInt(customerId);
//     }

//     // Filter by date range
//     if (startDate || endDate) {
//       where.clearanceDate = {};
//       if (startDate) {
//         where.clearanceDate.gte = new Date(startDate);
//       }
//       if (endDate) {
//         // Add one day to include the end date
//         const endDateTime = new Date(endDate);
//         endDateTime.setDate(endDateTime.getDate() + 1);
//         where.clearanceDate.lt = endDateTime;
//       }
//     }

//     const [clearances, total] = await Promise.all([
//       prisma.clearanceReceipt.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { clearanceDate: 'desc' },
//         include: {
//           customer: true,
//           clearedItems: {
//             include: {
//               entryItem: {
//                 include: {
//                   productType: true,
//                   productSubType: true,
//                   packType: true,
//                   room: true,
//                   entryReceipt: {
//                     select: {
//                       receiptNo: true,
//                       entryDate: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       }),
//       prisma.clearanceReceipt.count({ where }),
//     ]);

//     return NextResponse.json({
//       success: true,
//       data: clearances,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     console.error('Error fetching clearances:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to fetch clearances' },
//       { status: 500 }
//     );
//   }
// }

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
      if (startDate) where.clearanceDate.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.clearanceDate.lt = endDateTime;
      }
    }

    // Fetch only essential data
    const [clearances, total] = await Promise.all([
      prisma.clearanceReceipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { clearanceDate: 'desc' },
        select: {
          id: true,
          clearanceNo: true,
          clearanceDate: true,
          totalAmount: true,
          customer: {
            select: {
              id: true,
              name: true, // change to your customer name field
            },
          },
          _count: {
            select: { clearedItems: true }, // gives number of items
          },
        },
      }),
      prisma.clearanceReceipt.count({ where }),
    ]);

    // Map to your desired structure
    const formatted = clearances.map((c) => ({
      id: c.id,
      receiptNo: c.clearanceNo,
      customer: c.customer,
      date: c.clearanceDate,
      itemsCount: c._count.clearedItems,
      totalAmount: c.totalAmount,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
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
    console.log('Request Body:', body);

    // Parse and validate data

    const validatedData = clearanceReceiptSchema.parse({
      ...body,
      clearanceDate: body.clearanceDate
        ? new Date(body.clearanceDate)
        : new Date(),
    });

    if (validatedData.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one item must be selected for clearance',
        },
        { status: 400 }
      );
    }

    // Fetch all entry items with their entry receipts
    const entryItemIds = validatedData.items.map((item) => item.entryItemId);

    const entryItems = await prisma.entryItem.findMany({
      where: { id: { in: entryItemIds } },
      include: {
        entryReceipt: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (entryItems.length !== validatedData.items.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more entry items not found',
        },
        { status: 404 }
      );
    }

    // Verify quantities and calculate total amount
    let totalAmount = 0;
    const clearedItemsData: {
      entryItemId: number;
      entryReceiptId: number;
      clearQuantity: number;
      clearKjQuantity: number | null;
      totalAmount: number;
    }[] = [];

    for (const item of validatedData.items) {
      const entryItem = entryItems.find((ei) => ei.id === item.entryItemId);

      if (!entryItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Entry item ${item.entryItemId} not found`,
          },
          { status: 404 }
        );
      }

      // Verify sufficient quantity
      if (entryItem.remainingQuantity < item.clearQuantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient quantity for item ${item.entryItemId}. Available: ${entryItem.remainingQuantity}, Requested: ${item.clearQuantity}`,
          },
          { status: 400 }
        );
      }

      // Verify KJ quantity if applicable
      if (item.clearKjQuantity && item.clearKjQuantity > 0) {
        if (!entryItem.hasKhaliJali) {
          return NextResponse.json(
            {
              success: false,
              error: `Item ${item.entryItemId} does not have Khali Jali`,
            },
            { status: 400 }
          );
        }

        if (
          !entryItem.kjQuantity ||
          item.clearKjQuantity > entryItem.kjQuantity
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient KJ quantity for item ${item.entryItemId}. Available: ${entryItem.kjQuantity || 0}, Requested: ${item.clearKjQuantity}`,
            },
            { status: 400 }
          );
        }
      }

      // Calculate item total amount
      const itemAmount = item.clearQuantity * entryItem.unitPrice;
      const kjAmount =
        item.clearKjQuantity && entryItem.kjUnitPrice
          ? item.clearKjQuantity * entryItem.kjUnitPrice
          : 0;
      const itemTotalAmount = itemAmount + kjAmount;
      totalAmount += itemTotalAmount;

      clearedItemsData.push({
        entryItemId: item.entryItemId,
        entryReceiptId: entryItem.entryReceiptId,
        clearQuantity: item.clearQuantity,
        clearKjQuantity: item.clearKjQuantity || null,
        totalAmount: itemTotalAmount,
      });
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

    // Create clearance receipt with cleared items in a transaction
    const clearance = await prisma.$transaction(async (tx) => {
      // Create clearance receipt
      const receipt = await tx.clearanceReceipt.create({
        data: {
          clearanceNo: validatedData.receiptNo,
          customerId: validatedData.customerId,
          carNo: validatedData.carNo || null,
          clearanceDate: validatedData.clearanceDate || new Date(),
          totalAmount,
          description: validatedData.description || null,
          clearedItems: {
            create: clearedItemsData,
          },
        },
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
                      entryDate: true,
                    },
                  },
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
              decrement: item.clearQuantity,
            },
          },
        });
      }

      // Create ledger entry for clearance amount (DEBIT)
      await tx.ledger.create({
        data: {
          customerId: validatedData.customerId,
          invoiceId: receipt.id,
          description: `Clearance ${clearanceNo}`,
          debitAmount: 0,
          creditAmount: totalAmount,
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
