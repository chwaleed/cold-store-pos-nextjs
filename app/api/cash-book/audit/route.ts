import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/cash-book/audit - Get opening balance audit trail for a specific date or date range
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    let whereClause: any = {};

    if (dateParam) {
      // Single date query
      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const summary = await prisma.dailyCashSummary.findUnique({
        where: { date: startOfDay },
      });

      if (summary) {
        whereClause.dailyCashSummaryId = summary.id;
      } else {
        // No summary exists for this date, return empty audit trail
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    } else if (fromDateParam && toDateParam) {
      // Date range query
      const fromDate = new Date(fromDateParam);
      const toDate = new Date(toDateParam);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      const summaries = await prisma.dailyCashSummary.findMany({
        where: {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: { id: true },
      });

      if (summaries.length > 0) {
        whereClause.dailyCashSummaryId = {
          in: summaries.map((s) => s.id),
        };
      } else {
        // No summaries exist for this date range
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Date or date range parameters are required' },
        { status: 400 }
      );
    }

    const auditTrail = await prisma.openingBalanceAudit.findMany({
      where: whereClause,
      include: {
        dailyCashSummary: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        changeTimestamp: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: auditTrail,
    });
  } catch (error) {
    console.error('Error fetching opening balance audit trail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
