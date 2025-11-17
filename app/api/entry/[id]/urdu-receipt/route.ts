// API Route: Generate Urdu PDF Receipt for Entry
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateEntryReceiptHTML } from '@/lib/urdu-receipt-templates';
import { generatePDFFromHTML } from '@/lib/pdf-receipt-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = parseInt(params.id);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    // Fetch entry receipt with all relations
    const entry = await db.entryReceipt.findUnique({
      where: { id: entryId },
      include: {
        customer: true,
        items: {
          include: {
            productType: true,
            productSubType: true,
            packType: true,
            room: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry receipt not found' },
        { status: 404 }
      );
    }

    // Generate HTML from template
    const html = generateEntryReceiptHTML(entry as any);

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML({
      html,
      fileName: `entry-receipt-${entry.receiptNo}.pdf`,
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="entry-receipt-${entry.receiptNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating entry receipt PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
