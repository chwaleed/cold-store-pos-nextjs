import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { dailySummaryUpdateSchema } from '@/schema/cash-book';

// PUT /api/cash-book/summary/[id] - Update daily summary
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid summary ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = dailySummaryUpdateSchema.parse(body);

    // Check if summary exists
    const existingSummary = await prisma.dailyCashSummary.findUnique({
      where: { id },
    });

    if (!existingSummary) {
      return NextResponse.json(
        { success: false, error: 'Daily summary not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // If opening balance is being updated, recalculate closing balance and create audit trail
      let updateData: any = { ...validatedData };
      let auditCreated = false;

      if (validatedData.openingBalance !== undefined) {
        const oldOpeningBalance = existingSummary.openingBalance;
        const newOpeningBalance = validatedData.openingBalance;

        const closingBalance =
          newOpeningBalance +
          existingSummary.totalInflows -
          existingSummary.totalOutflows;

        updateData.closingBalance = closingBalance;

        // Create audit trail if opening balance changed
        if (oldOpeningBalance !== newOpeningBalance) {
          await tx.openingBalanceAudit.create({
            data: {
              dailyCashSummaryId: id,
              oldOpeningBalance,
              newOpeningBalance,
              changeReason:
                body.changeReason || 'Opening balance update via API',
              changedBy: body.changedBy || 'System',
              changeTimestamp: new Date(),
            },
          });
          auditCreated = true;
        }
      }

      // If reconciliation status is being updated, set timestamp
      if (
        validatedData.isReconciled !== undefined &&
        validatedData.isReconciled
      ) {
        updateData.reconciledAt = new Date();
        if (!validatedData.reconciledBy) {
          updateData.reconciledBy = 'system'; // TODO: Replace with actual user when auth is implemented
        }
      }

      const updatedSummary = await tx.dailyCashSummary.update({
        where: { id },
        data: updateData,
      });

      return { summary: updatedSummary, auditCreated };
    });

    return NextResponse.json({
      success: true,
      data: result.summary,
      message: 'Daily summary updated successfully',
      auditCreated: result.auditCreated,
    });
  } catch (error: any) {
    console.error('Error updating daily summary:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Daily summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update daily summary' },
      { status: 500 }
    );
  }
}

// GET /api/cash-book/summary/[id] - Get specific daily summary by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid summary ID' },
        { status: 400 }
      );
    }

    // Include audit trail information if requested
    const includeAudit =
      request.nextUrl.searchParams.get('includeAudit') === 'true';

    const summary = await prisma.dailyCashSummary.findUnique({
      where: { id },
      include: includeAudit
        ? {
            auditTrail: {
              orderBy: {
                changeTimestamp: 'desc',
              },
            },
          }
        : undefined,
    });

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Daily summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily summary' },
      { status: 500 }
    );
  }
}
