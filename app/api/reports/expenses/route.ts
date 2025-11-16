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
    const categoryId = searchParams.get('categoryId');
    const period = searchParams.get('period'); // 'day' | 'month' | 'year' | 'all'
    const date = searchParams.get('date'); // ISO date string

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (date && period !== 'all') {
      const referenceDate = new Date(date);

      switch (period) {
        case 'day':
          startDate = startOfDay(referenceDate);
          endDate = endOfDay(referenceDate);
          break;
        case 'month':
          startDate = startOfMonth(referenceDate);
          endDate = endOfMonth(referenceDate);
          break;
        case 'year':
          startDate = startOfYear(referenceDate);
          endDate = endOfYear(referenceDate);
          break;
      }
    }

    const where: any = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals by category
    const totalByCategory: Record<string, number> = {};
    let grandTotal = 0;

    expenses.forEach((expense) => {
      const categoryName = expense.category.name;
      if (!totalByCategory[categoryName]) {
        totalByCategory[categoryName] = 0;
      }
      totalByCategory[categoryName] += expense.amount;
      grandTotal += expense.amount;
    });

    // Get all categories for the report
    const categories = await db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      expenses,
      categories,
      summary: {
        totalByCategory,
        grandTotal,
        count: expenses.length,
      },
      filters: {
        period,
        date,
        categoryId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching expense report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense report' },
      { status: 500 }
    );
  }
}
