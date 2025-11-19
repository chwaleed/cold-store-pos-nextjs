import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();

    const eligibleItems = await prisma.entryItem.findMany({
      where: {
        isDoubled: false,
        remainingQuantity: { gt: 0 },
        productType: { doubleRentAfter30Days: true },
        entryReceipt: {
          entryDate: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      select: {
        id: true,
        unitPrice: true,
        remainingQuantity: true,
        entryReceipt: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    console.log(eligibleItems);

    if (eligibleItems.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const operations = eligibleItems.flatMap((item) => [
      prisma.entryItem.update({
        where: { id: item.id },
        data: { isDoubled: true },
      }),
      prisma.ledger.create({
        data: {
          customerId: item.entryReceipt.customerId,
          type: 'adding_inventory',
          entryReceiptId: item.entryReceipt.id,
          description: `Entry Receipt: ${item.entryReceipt.id} (Double Rent Applied)`,
          debitAmount: item.unitPrice * item.remainingQuantity,
          creditAmount: 0,
        },
      }),
    ]);

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true, updated: eligibleItems.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
