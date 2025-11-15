import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Get customers who have items in storage
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        entryReceipts: {
          some: {
            items: {
              some: {
                remainingQuantity: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
      include: {
        entryReceipts: {
          where: {
            items: {
              some: {
                remainingQuantity: {
                  gt: 0,
                },
              },
            },
          },
          include: {
            items: {
              where: {
                remainingQuantity: {
                  gt: 0,
                },
              },
              include: {
                productType: true,
                productSubType: true,
              },
            },
          },
          orderBy: {
            entryDate: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers with inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
