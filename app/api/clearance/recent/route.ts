import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');

    const clearances = await prisma.clearanceReceipt.findMany({
      orderBy: { clearanceDate: 'desc' },
      take: limit,
      include: {
        customer: true,
      },
    });

    const mapped = clearances.map((c) => ({
      id: c.id,
      clearanceNo: c.clearanceNo,
      customer: { name: c.customer?.name },
      carNo: c.carNo,
      clearanceDate: c.clearanceDate,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching recent clearances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent clearances' },
      { status: 500 }
    );
  }
}
