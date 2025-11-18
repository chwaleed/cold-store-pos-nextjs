import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // total customers
    const totalCustomers = await prisma.customer.count();

    // active entries (count of entry items where remainingQuantity > 0)
    const activeEntries = await prisma.entryItem.count({
      where: {
        remainingQuantity: { gt: 0 },
      },
    });

    // clearances today
    const clearancesToday = await prisma.clearanceReceipt.count({
      where: {
        clearanceDate: { gte: startOfDay, lt: endOfDay },
      },
    });

    // monthly revenue - sum of totalAmount for clearances in the current month
    const monthlyRevenueAggregate = await prisma.clearanceReceipt.aggregate({
      where: {
        clearanceDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { totalAmount: true },
    });

    const monthlyRevenue = monthlyRevenueAggregate._sum.totalAmount ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        activeEntries,
        clearancesToday,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
