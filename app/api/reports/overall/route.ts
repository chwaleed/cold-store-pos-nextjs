import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productTypeId = searchParams.get('productTypeId');
    const productSubTypeId = searchParams.get('productSubTypeId');
    const dateFrom = searchParams.get('dateFrom'); // ISO date string
    const dateTo = searchParams.get('dateTo'); // ISO date string

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    const startDate = startOfDay(new Date(dateFrom));
    const endDate = endOfDay(new Date(dateTo));

    // Fetch all entries in period
    const entries = await db.entryReceipt.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lte: endDate,
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
          where: {
            ...(productTypeId && { productTypeId: parseInt(productTypeId) }),
            ...(productSubTypeId && {
              productSubTypeId: parseInt(productSubTypeId),
            }),
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });

    // Fetch all clearances in period
    const clearances = await db.clearanceReceipt.findMany({
      where: {
        clearanceDate: {
          gte: startDate,
          lte: endDate,
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
              },
            },
          },
          where: {
            entryItem: {
              ...(productTypeId && { productTypeId: parseInt(productTypeId) }),
              ...(productSubTypeId && {
                productSubTypeId: parseInt(productSubTypeId),
              }),
            },
          },
        },
      },
      orderBy: { clearanceDate: 'desc' },
    });

    // Calculate totals
    const totalEntryAmount = entries.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalEntryQuantity = entries.reduce(
      (sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );

    const totalClearanceAmount = clearances.reduce(
      (sum, r) => sum + r.totalAmount,
      0
    );
    const totalClearanceQuantity = clearances.reduce(
      (sum, r) =>
        sum +
        r.clearedItems.reduce((itemSum, i) => itemSum + i.clearQuantity, 0),
      0
    );

    // Group by product type
    const entryByType: Record<string, { quantity: number; amount: number }> =
      {};
    const clearanceByType: Record<
      string,
      { quantity: number; amount: number }
    > = {};

    entries.forEach((entry) => {
      entry.items.forEach((item) => {
        const typeName = item.productType.name;
        if (!entryByType[typeName]) {
          entryByType[typeName] = { quantity: 0, amount: 0 };
        }
        entryByType[typeName].quantity += item.quantity;
        entryByType[typeName].amount += item.totalPrice;
      });
    });

    clearances.forEach((clearance) => {
      clearance.clearedItems.forEach((item) => {
        const typeName = item.entryItem.productType.name;
        if (!clearanceByType[typeName]) {
          clearanceByType[typeName] = { quantity: 0, amount: 0 };
        }
        clearanceByType[typeName].quantity += item.clearQuantity;
        clearanceByType[typeName].amount += item.totalAmount;
      });
    });

    // Group by room
    const entryByRoom: Record<string, { quantity: number; amount: number }> =
      {};
    const clearanceByRoom: Record<
      string,
      { quantity: number; amount: number }
    > = {};

    entries.forEach((entry) => {
      entry.items.forEach((item) => {
        const roomName = item.room?.name || 'No Room';
        if (!entryByRoom[roomName]) {
          entryByRoom[roomName] = { quantity: 0, amount: 0 };
        }
        entryByRoom[roomName].quantity += item.quantity;
        entryByRoom[roomName].amount += item.totalPrice;
      });
    });

    clearances.forEach((clearance) => {
      clearance.clearedItems.forEach((item) => {
        const roomName = item.entryItem.room?.name || 'No Room';
        if (!clearanceByRoom[roomName]) {
          clearanceByRoom[roomName] = { quantity: 0, amount: 0 };
        }
        clearanceByRoom[roomName].quantity += item.clearQuantity;
        clearanceByRoom[roomName].amount += item.totalAmount;
      });
    });

    // Calculate current stock by room
    const currentStockByRoom: Record<string, { quantity: number }> = {};

    // Add entry quantities
    Object.entries(entryByRoom).forEach(([roomName, data]) => {
      currentStockByRoom[roomName] = { quantity: data.quantity };
    });

    // Subtract clearance quantities
    Object.entries(clearanceByRoom).forEach(([roomName, data]) => {
      if (currentStockByRoom[roomName]) {
        currentStockByRoom[roomName].quantity -= data.quantity;
      } else {
        currentStockByRoom[roomName] = { quantity: -data.quantity };
      }
    });

    // Filter out negative or zero stock
    const filteredCurrentStockByRoom = Object.fromEntries(
      Object.entries(currentStockByRoom).filter(([, data]) => data.quantity > 0)
    );

    // Group by product type and subtype for detailed breakdown
    const entryByTypeSubtype: Record<
      string,
      {
        productType: string;
        productSubType?: string;
        quantity: number;
        amount: number;
      }
    > = {};
    const clearanceByTypeSubtype: Record<
      string,
      {
        productType: string;
        productSubType?: string;
        quantity: number;
        amount: number;
      }
    > = {};

    entries.forEach((entry) => {
      entry.items.forEach((item) => {
        const key = item.productSubType
          ? `${item.productType.name}-${item.productSubType.name}`
          : item.productType.name;

        if (!entryByTypeSubtype[key]) {
          entryByTypeSubtype[key] = {
            productType: item.productType.name,
            productSubType: item.productSubType?.name,
            quantity: 0,
            amount: 0,
          };
        }
        entryByTypeSubtype[key].quantity += item.quantity;
        entryByTypeSubtype[key].amount += item.totalPrice;
      });
    });

    clearances.forEach((clearance) => {
      clearance.clearedItems.forEach((item) => {
        const key = item.entryItem.productSubType
          ? `${item.entryItem.productType.name}-${item.entryItem.productSubType.name}`
          : item.entryItem.productType.name;

        if (!clearanceByTypeSubtype[key]) {
          clearanceByTypeSubtype[key] = {
            productType: item.entryItem.productType.name,
            productSubType: item.entryItem.productSubType?.name,
            quantity: 0,
            amount: 0,
          };
        }
        clearanceByTypeSubtype[key].quantity += item.clearQuantity;
        clearanceByTypeSubtype[key].amount += item.totalAmount;
      });
    });

    // Calculate current stock by type and subtype
    const currentStockByTypeSubtype: Record<
      string,
      {
        productType: string;
        productSubType?: string;
        quantity: number;
      }
    > = {};

    // Add entry quantities
    Object.entries(entryByTypeSubtype).forEach(([key, data]) => {
      currentStockByTypeSubtype[key] = {
        productType: data.productType,
        productSubType: data.productSubType,
        quantity: data.quantity,
      };
    });

    // Subtract clearance quantities
    Object.entries(clearanceByTypeSubtype).forEach(([key, data]) => {
      if (currentStockByTypeSubtype[key]) {
        currentStockByTypeSubtype[key].quantity -= data.quantity;
      } else {
        currentStockByTypeSubtype[key] = {
          productType: data.productType,
          productSubType: data.productSubType,
          quantity: -data.quantity,
        };
      }
    });

    // Convert to array and sort
    const detailedProductBreakdown = Object.entries(currentStockByTypeSubtype)
      .map(([key, data]) => ({
        key,
        productType: data.productType,
        productSubType: data.productSubType,
        entryQuantity: entryByTypeSubtype[key]?.quantity || 0,
        clearanceQuantity: clearanceByTypeSubtype[key]?.quantity || 0,
        currentQuantity: data.quantity,
      }))
      .sort((a, b) => {
        // Sort by product type first, then by subtype
        if (a.productType !== b.productType) {
          return a.productType.localeCompare(b.productType);
        }
        if (a.productSubType && b.productSubType) {
          return a.productSubType.localeCompare(b.productSubType);
        }
        if (a.productSubType && !b.productSubType) return 1;
        if (!a.productSubType && b.productSubType) return -1;
        return 0;
      });

    return NextResponse.json({
      entries,
      clearances,
      summary: {
        totalEntryAmount,
        totalEntryQuantity,
        totalClearanceAmount,
        totalClearanceQuantity,
        entryByType,
        clearanceByType,
        entryByRoom,
        clearanceByRoom,
        currentStockByRoom: filteredCurrentStockByRoom,
        detailedProductBreakdown,
      },
      filters: {
        dateFrom,
        dateTo,
        productTypeId,
        productSubTypeId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching overall report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall report' },
      { status: 500 }
    );
  }
}
