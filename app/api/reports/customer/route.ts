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
    const customerId = searchParams.get('customerId');
    const productTypeId = searchParams.get('productTypeId');
    const productSubTypeId = searchParams.get('productSubTypeId');
    const reportType = searchParams.get('reportType'); // 'entry' | 'clearance' | 'both'
    const fromDateStr = searchParams.get('fromDate'); // ISO date string
    const toDateStr = searchParams.get('toDate'); // ISO date string
    const detailed = searchParams.get('detailed') === 'true';
    const marka = searchParams.get('marka');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!fromDateStr || !toDateStr) {
      return NextResponse.json(
        { error: 'From date and to date are required' },
        { status: 400 }
      );
    }

    const startDate = startOfDay(new Date(fromDateStr));
    const endDate = endOfDay(new Date(toDateStr));

    const customer = await db.customer.findUnique({
      where: { id: parseInt(customerId) },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    let entryData = null;
    let clearanceData = null;

    // Fetch entry data if needed
    if (reportType === 'entry' || reportType === 'both') {
      const entryWhere: any = {
        customerId: parseInt(customerId),
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      let entries = await db.entryReceipt.findMany({
        where: entryWhere,
        include: {
          items: {
            include: {
              productType: true,
              productSubType: true,
              packType: true,
              room: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
      });

      // Filter items after fetching if filters are applied
      if (productTypeId || productSubTypeId || marka) {
        entries = entries
          .map((entry) => ({
            ...entry,
            items: entry.items.filter((item) => {
              let matches = true;
              if (
                productTypeId &&
                item.productTypeId !== parseInt(productTypeId)
              ) {
                matches = false;
              }
              if (
                productSubTypeId &&
                item.productSubTypeId !== parseInt(productSubTypeId)
              ) {
                matches = false;
              }
              if (
                marka &&
                (!item.marka ||
                  !item.marka.toLowerCase().includes(marka.toLowerCase()))
              ) {
                matches = false;
              }
              return matches;
            }),
          }))
          .filter((entry) => entry.items.length > 0);
      }

      entryData = {
        receipts: entries,
        totalAmount: entries.reduce((sum, r) => sum + r.totalAmount, 0),
        totalQuantity: entries.reduce(
          (sum, r) =>
            sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
          0
        ),
      };
    }

    // Fetch clearance data if needed
    if (reportType === 'clearance' || reportType === 'both') {
      const clearanceWhere: any = {
        customerId: parseInt(customerId),
        clearanceDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      let clearances = await db.clearanceReceipt.findMany({
        where: clearanceWhere,
        include: {
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
        orderBy: { clearanceDate: 'desc' },
      });

      // Filter cleared items after fetching if filters are applied
      if (productTypeId || productSubTypeId || marka) {
        clearances = clearances
          .map((clearance) => ({
            ...clearance,
            clearedItems: clearance.clearedItems.filter((item) => {
              let matches = true;
              if (
                productTypeId &&
                item.entryItem.productTypeId !== parseInt(productTypeId)
              ) {
                matches = false;
              }
              if (
                productSubTypeId &&
                item.entryItem.productSubTypeId !== parseInt(productSubTypeId)
              ) {
                matches = false;
              }
              if (
                marka &&
                (!item.entryItem.marka ||
                  !item.entryItem.marka
                    .toLowerCase()
                    .includes(marka.toLowerCase()))
              ) {
                matches = false;
              }
              return matches;
            }),
          }))
          .filter((clearance) => clearance.clearedItems.length > 0);
      }

      clearanceData = {
        receipts: clearances,
        totalAmount: clearances.reduce((sum, r) => sum + r.totalAmount, 0),
        totalQuantity: clearances.reduce(
          (sum, r) =>
            sum +
            r.clearedItems.reduce((itemSum, i) => itemSum + i.clearQuantity, 0),
          0
        ),
      };
    }

    // Calculate balance from ledger
    const ledger = await db.ledger.findMany({
      where: {
        customerId: parseInt(customerId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const balance = ledger.reduce(
      (sum, entry) => sum + entry.debitAmount - entry.creditAmount,
      0
    );

    // Generate summary data if not detailed
    let entrySummaryData = null;
    let clearanceSummaryData = null;
    let currentStockSummaryData = null;
    let markaData = null;

    if (!detailed) {
      // Entry Summary
      const entrySummary = new Map<
        string,
        { productType: string; subType?: string; totalQuantity: number }
      >();

      if (entryData?.receipts) {
        entryData.receipts.forEach((receipt: any) => {
          receipt.items.forEach((item: any) => {
            const key = item.productSubType
              ? `${item.productType.name}-${item.productSubType.name}`
              : item.productType.name;

            if (entrySummary.has(key)) {
              entrySummary.get(key)!.totalQuantity += item.quantity;
            } else {
              entrySummary.set(key, {
                productType: item.productType.name,
                subType: item.productSubType?.name,
                totalQuantity: item.quantity,
              });
            }
          });
        });
      }

      entrySummaryData = Array.from(entrySummary.values());

      // Clearance Summary
      const clearanceSummary = new Map<
        string,
        { productType: string; subType?: string; totalQuantity: number }
      >();

      if (clearanceData?.receipts) {
        clearanceData.receipts.forEach((receipt: any) => {
          receipt.clearedItems.forEach((item: any) => {
            const key = item.entryItem.productSubType
              ? `${item.entryItem.productType.name}-${item.entryItem.productSubType.name}`
              : item.entryItem.productType.name;

            if (clearanceSummary.has(key)) {
              clearanceSummary.get(key)!.totalQuantity += item.clearQuantity;
            } else {
              clearanceSummary.set(key, {
                productType: item.entryItem.productType.name,
                subType: item.entryItem.productSubType?.name,
                totalQuantity: item.clearQuantity,
              });
            }
          });
        });
      }

      clearanceSummaryData = Array.from(clearanceSummary.values());

      // Current Stock Summary (Entry - Clearance)
      const currentStockSummary = new Map<
        string,
        { productType: string; subType?: string; totalQuantity: number }
      >();

      // Add entry quantities
      entrySummary.forEach((value, key) => {
        currentStockSummary.set(key, { ...value });
      });

      // Subtract clearance quantities
      clearanceSummary.forEach((value, key) => {
        if (currentStockSummary.has(key)) {
          currentStockSummary.get(key)!.totalQuantity -= value.totalQuantity;
        } else {
          currentStockSummary.set(key, {
            ...value,
            totalQuantity: -value.totalQuantity,
          });
        }
      });

      currentStockSummaryData = Array.from(currentStockSummary.values()).filter(
        (item) => item.totalQuantity > 0
      );
    }

    // Generate marka-specific data if marka search is provided
    let entryMarkaData = null;
    let clearanceMarkaData = null;
    let currentStockMarkaData = null;

    if (marka) {
      // Entry Marka Summary
      const entryMarkaMap = new Map<
        string,
        { marka: string; totalQuantity: number }
      >();

      if (entryData?.receipts) {
        entryData.receipts.forEach((receipt: any) => {
          receipt.items.forEach((item: any) => {
            if (
              item.marka &&
              item.marka.toLowerCase().includes(marka.toLowerCase())
            ) {
              if (entryMarkaMap.has(item.marka)) {
                entryMarkaMap.get(item.marka)!.totalQuantity += item.quantity;
              } else {
                entryMarkaMap.set(item.marka, {
                  marka: item.marka,
                  totalQuantity: item.quantity,
                });
              }
            }
          });
        });
      }

      entryMarkaData = Array.from(entryMarkaMap.values());

      // Clearance Marka Summary
      const clearanceMarkaMap = new Map<
        string,
        { marka: string; totalQuantity: number }
      >();

      if (clearanceData?.receipts) {
        clearanceData.receipts.forEach((receipt: any) => {
          receipt.clearedItems.forEach((item: any) => {
            if (
              item.entryItem.marka &&
              item.entryItem.marka.toLowerCase().includes(marka.toLowerCase())
            ) {
              if (clearanceMarkaMap.has(item.entryItem.marka)) {
                clearanceMarkaMap.get(item.entryItem.marka)!.totalQuantity +=
                  item.clearQuantity;
              } else {
                clearanceMarkaMap.set(item.entryItem.marka, {
                  marka: item.entryItem.marka,
                  totalQuantity: item.clearQuantity,
                });
              }
            }
          });
        });
      }

      clearanceMarkaData = Array.from(clearanceMarkaMap.values());

      // Current Stock Marka Summary (Entry - Clearance)
      const currentStockMarkaMap = new Map<
        string,
        { marka: string; totalQuantity: number }
      >();

      // Add entry quantities
      entryMarkaMap.forEach((value, key) => {
        currentStockMarkaMap.set(key, { ...value });
      });

      // Subtract clearance quantities
      clearanceMarkaMap.forEach((value, key) => {
        if (currentStockMarkaMap.has(key)) {
          currentStockMarkaMap.get(key)!.totalQuantity -= value.totalQuantity;
        } else {
          currentStockMarkaMap.set(key, {
            ...value,
            totalQuantity: -value.totalQuantity,
          });
        }
      });

      currentStockMarkaData = Array.from(currentStockMarkaMap.values()).filter(
        (item) => item.totalQuantity > 0
      );
    }

    return NextResponse.json({
      customer,
      entryData: detailed ? entryData : null,
      clearanceData: detailed ? clearanceData : null,
      entrySummaryData,
      clearanceSummaryData,
      currentStockSummaryData,
      entryMarkaData,
      clearanceMarkaData,
      currentStockMarkaData,
      ledger,
      balance,
      filters: {
        fromDate: fromDateStr,
        toDate: toDateStr,
        reportType,
        detailed,
        productTypeId,
        productSubTypeId,
        marka,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching customer report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer report' },
      { status: 500 }
    );
  }
}
