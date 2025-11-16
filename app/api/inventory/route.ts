import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

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

    // Fetch entry items with related data
    const entryItems = await prisma.entryItem.findMany({
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
    });

    const today = new Date();

    console.log('Fetched entry items:', entryItems);

    // Calculate inventory with double rent logic
    const inventory = entryItems
      .map((item) => {
        const availableQty = item.remainingQuantity;
        const availableKjQty = item.remainingKjQuantity ?? 0;

        // Skip if zero stock and filter is off
        // Item is available if it has ANY remaining quantity (product OR KJ)
        const isAvailable = item.hasKhaliJali
          ? availableQty > 0 || availableKjQty > 0
          : availableQty > 0;

        if (!showZeroStock && !isAvailable) {
          return null;
        }
        const daysInStorage = differenceInDays(
          today,
          item.entryReceipt.entryDate
        );

        // Double rent calculation
        const isDoubleRent =
          item.productType.doubleRentAfter30Days && daysInStorage > 30;
        const currentPrice = isDoubleRent ? item.unitPrice * 2 : item.unitPrice;
        const totalValue = availableQty * currentPrice;

        // For types with doubleRentAfter30Days, show negative days after 30 days
        const displayDays =
          item.productType.doubleRentAfter30Days && daysInStorage > 30
            ? -(daysInStorage - 30)
            : daysInStorage;

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
          currentPrice,
          totalValue,
          daysInStorage,
          displayDays,
          kjQuantity: item.kjQuantity,
          kjUnitPrice: item.kjUnitPrice,
          kjTotal: item.kjTotal,
          isDoubleRent,
          grandTotal:
            availableQty * currentPrice +
            availableKjQty * (item.kjUnitPrice || 0),
          hasKhaliJali: item.hasKhaliJali,
          remainingKjQuantity: item.remainingKjQuantity,
          reciptNo: item.entryReceipt?.receiptNo,
          hasDoubleRentEnabled: item.productType.doubleRentAfter30Days,
        };
      })
      .filter((item) => item !== null);

    // Calculate summary properly
    const summary = {
      totalRecords: inventory.length, // number of rows
      totalQuantity: inventory.reduce(
        (sum, item) => sum + (item.availableQty || 0),
        0
      ),
      totalValue: inventory.reduce(
        (sum, item) => sum + (item.grandTotal || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: inventory,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
