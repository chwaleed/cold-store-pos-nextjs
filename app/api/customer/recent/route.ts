import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        village: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching recent customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent customers' },
      { status: 500 }
    );
  }
}
