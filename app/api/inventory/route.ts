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

    // Build where clause
    const where: any = {};

    if (room && room !== 'all') {
      where.roomId = parseInt(room);
    }

    if (type && type !== 'all') {
      where.productTypeId = parseInt(type);
    }

    if (marka) {
      where.marka = { contains: marka, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.entryReceipt = {
        entryDate: {},
      };
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
        clearedItems: true,
      },
      orderBy: {
        entryReceipt: {
          entryDate: 'desc',
        },
      },
    });

    const today = new Date();

    // Calculate inventory with double rent logic
    const inventory = entryItems
      .map((item) => {
        const availableQty = item.remainingQuantity;

        // Skip if zero stock and filter is off
        if (!showZeroStock && availableQty <= 0) {
          return null;
        }

        const daysInStorage = differenceInDays(
          today,
          item.entryReceipt.entryDate
        );
        const storageTillDate = item.entryReceipt.storageTillDate;
        const daysLeft = storageTillDate
          ? differenceInDays(storageTillDate, today)
          : null;

        // Double rent calculation
        const isDoubleRent =
          item.productType.doubleRentAfter30Days && daysInStorage > 30;
        const currentPrice = isDoubleRent ? item.unitPrice * 2 : item.unitPrice;
        const totalValue = availableQty * currentPrice;

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
          storageTillDate,
          unitPrice: item.unitPrice,
          currentPrice,
          totalValue,
          daysInStorage,
          daysLeft,
          isDoubleRent,
        };
      })
      .filter((item) => item !== null);

    // Calculate summary
    const summary = {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce(
        (sum, item) => sum + (item?.availableQty || 0),
        0
      ),
      totalValue: inventory.reduce(
        (sum, item) => sum + (item?.totalValue || 0),
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
