import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');

    const entries = await prisma.entryReceipt.findMany({
      orderBy: { entryDate: 'desc' },
      take: limit,
      include: {
        customer: true,
      },
    });

    // Map to simpler structure
    const mapped = entries.map((e) => ({
      id: e.id,
      receiptNo: e.receiptNo,
      customer: { name: e.customer?.name },
      carNo: e.carNo,
      entryDate: e.entryDate,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching recent entry receipts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent entry receipts' },
      { status: 500 }
    );
  }
}
