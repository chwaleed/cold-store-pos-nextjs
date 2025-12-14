import { NextRequest, NextResponse } from 'next/server';
import { generatePDFFromHTML } from '@/lib/pdf-receipt-generator';
import { buildAuditReportHTML } from '@/lib/pdf-templates';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, fromDate, toDate } = body;

    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Generate HTML using Urdu template
    const html = buildAuditReportHTML(reportData, { fromDate, toDate });

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML({
      html,
      fileName: `profit_audit_${format(new Date(fromDate), 'yyyy-MM-dd')}_to_${format(new Date(toDate), 'yyyy-MM-dd')}.pdf`,
    });

    // Return PDF as response
    const response = new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="profit_audit_${format(new Date(fromDate), 'yyyy-MM-dd')}_to_${format(new Date(toDate), 'yyyy-MM-dd')}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
