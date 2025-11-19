// API Route: Generate Urdu PDF Receipt for Clearance
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateClearanceReceiptHTML } from '@/lib/urdu-receipt-templates';
import { generatePDFFromHTML } from '@/lib/pdf-receipt-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clearanceId = parseInt(params.id);

    if (isNaN(clearanceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid clearance ID' },
        { status: 400 }
      );
    }

    // Fetch clearance receipt with all relations
    const clearance = await db.clearanceReceipt.findUnique({
      where: { id: clearanceId },
      include: {
        customer: true,
        clearedItems: {
          include: {
            entryItem: {
              include: {
                productType: true,
                productSubType: true,
                packType: true,
                room: true,
                entryReceipt: true,
              },
            },
          },
        },
      },
    });

    if (!clearance) {
      return NextResponse.json(
        { success: false, error: 'Clearance receipt not found' },
        { status: 404 }
      );
    }
    console.log('Clearance fetched for PDF:', clearance);

    // Generate HTML from template
    const html = generateClearanceReceiptHTML(clearance as any);

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML({
      html,
      fileName: `clearance-receipt-${clearance.clearanceNo}.pdf`,
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="clearance-receipt-${clearance.clearanceNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating clearance receipt PDF:', error);
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
